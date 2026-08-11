import { system, world, EquipmentSlot, GameMode } from "@minecraft/server";

/**
 * 飛行状態にするために必要な防具一式（部位ごとのアイテムID）。
 * 実際の識別子に置き換えてください。
 */
const FLIGHT_ARMOR_SET = {
    head: "hraddons:manaita_helmet",
    chest: ["hraddons:manaita_chest", "hraddons:manaita_chest_knockback"],
    legs: "hraddons:manaita_leggings",
    feet: "hraddons:manaita_boots",
};

/** 水平方向の飛行速度（1tickあたりの移動量） */
const FLIGHT_SPEED = 1.0;
/** 上昇・下降速度（1tickあたりの移動量） */
const VERTICAL_SPEED = 0.5;
/** ダブルジャンプとみなす猶予時間（tick）。20tick = 1秒 */
const DOUBLE_JUMP_WINDOW_TICKS = 8;

/**
 * プレイヤーが FLIGHT_ARMOR_SET を全部装備しているか判定する。
 */
function hasFullFlightSet(player) {
    const equippable = player.getComponent("minecraft:equippable");
    if (!equippable) return false;

    const head = equippable.getEquipment(EquipmentSlot.Head);
    const chest = equippable.getEquipment(EquipmentSlot.Chest);
    const legs = equippable.getEquipment(EquipmentSlot.Legs);
    const feet = equippable.getEquipment(EquipmentSlot.Feet);
    const chestOk = FLIGHT_ARMOR_SET.chest.includes(chest?.typeId);

    return (
        head?.typeId === FLIGHT_ARMOR_SET.head &&
        chestOk &&
        legs?.typeId === FLIGHT_ARMOR_SET.legs &&
        feet?.typeId === FLIGHT_ARMOR_SET.feet
    );
}

/**
 * プレイヤーごとの状態を保持するMap。
 * flying: 現在飛行中かどうか
 * wasJumping: 前tickでジャンプ入力があったか（立ち上がりエッジ検出用）
 * lastJumpPressTick: 直近でジャンプが「押された瞬間」を検出したtick数
 */
const playerFlightState = new Map();

function getState(player) {
    let state = playerFlightState.get(player.id);
    if (!state) {
        state = { flying: false, wasJumping: false, lastJumpPressTick: -9999 };
        playerFlightState.set(player.id, state);
    }
    return state;
}

// プレイヤー離脱時に状態を掃除
world.afterEvents.playerLeave.subscribe((event) => {
    playerFlightState.delete(event.playerId);
});

system.runInterval(() => {
    const currentTick = system.currentTick;

    for (const player of world.getPlayers()) {
        const state = getState(player);
        const equipped = hasFullFlightSet(player);

        // 装備が外れたら強制的に飛行終了
        if (!equipped && state.flying) {
            state.flying = false;
        }

        // クリエイティブ/スペクテイターは元々飛べるので何もしない
        const gameMode = player.getGameMode();
        if (gameMode === GameMode.Creative || gameMode === GameMode.Spectator) {
            state.wasJumping = player.isJumping;
            continue;
        }

        // ---- ダブルジャンプ検出（ジャンプ入力の立ち上がりエッジ） ----
        const isJumpingNow = player.isJumping;
        const jumpPressedThisTick = isJumpingNow && !state.wasJumping;
        state.wasJumping = isJumpingNow;

        if (equipped && jumpPressedThisTick && !player.isOnGround) {
            // 空中でジャンプ入力があった＝1回分のジャンプ押下として記録
            const ticksSinceLastPress = currentTick - state.lastJumpPressTick;

            if (ticksSinceLastPress <= DOUBLE_JUMP_WINDOW_TICKS) {
                // 猶予時間内の2回目 → 飛行ON/OFFを切り替え
                state.flying = !state.flying;
                state.lastJumpPressTick = -9999; // 連続トグル防止のためリセット
            } else {
                state.lastJumpPressTick = currentTick;
            }
        }

        // ---- 飛行中の移動処理 ----
        if (state.flying) {
            const rot = player.getRotation(); // { x: pitch, y: yaw }
            const yawRad = (rot.y * Math.PI) / 180;

            // yaw基準の前方向・右方向ベクトル
            const forwardX = -Math.sin(yawRad);
            const forwardZ = Math.cos(yawRad);
            const rightX = Math.cos(yawRad);
            const rightZ = Math.sin(yawRad);

            // WASD入力を取得（x: 左右, y: 前後 -1〜1）
            const move = player.inputInfo.getMovementVector();

            const velocityX = (forwardX * move.y + rightX * move.x) * FLIGHT_SPEED;
            const velocityZ = (forwardZ * move.y + rightZ * move.x) * FLIGHT_SPEED;

            // 上昇(ジャンプ長押し)・下降(しゃがみ)・停止(何もしない=空中停止)
            let velocityY = 0;
            if (player.isJumping) velocityY = VERTICAL_SPEED;
            else if (player.isSneaking) velocityY = -VERTICAL_SPEED;

            player.clearVelocity();
            player.applyImpulse({ x: velocityX, y: velocityY, z: velocityZ });
        }
    }
}, 1); // 毎tick実行（滑らかさ重視）