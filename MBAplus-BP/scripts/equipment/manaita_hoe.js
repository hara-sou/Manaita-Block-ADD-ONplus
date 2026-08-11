import { system } from "@minecraft/server";

/* 耕して farmland に変換できる対象ブロック */
const pathTargets = [
    "minecraft:dirt",
    "minecraft:grass_block",
    "minecraft:grass_path",
    "minecraft:coarse_dirt"
];

/**
 * 一括破壊の対象を絞り込むためのブロックタグ。
 * このタグを持たないブロックを破壊しても連鎖処理は行わない。
 */
const DESTRUCTIBLE_TAG = "minecraft:is_hoe_item_destructible";

/**
 * 1回の連鎖破壊で処理できるブロック数の上限。
 * 広範囲の同種ブロックによるサーバー負荷・処理落ちを防ぐための安全装置。
 */
const MAX_CHAIN_COUNT = 200;

/**
 * 探索対象とする隣接方向のオフセット。
 * 3x3x3の立方体から中心(0,0,0)を除いた26方向（斜めも含む）を自動生成する。
 */
const NEIGHBOR_OFFSETS = (() => {
    const offsets = [];
    for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
            for (let z = -1; z <= 1; z++) {
                if (x === 0 && y === 0 && z === 0) continue; // 中心（自分自身）は除外
                offsets.push({ x, y, z });
            }
        }
    }
    return offsets;
})();

function chainProcess(dim, startLoc, targetTypeId, action) {
    const visited = new Set();
    const key = (p) => `${p.x},${p.y},${p.z}`;

    const queue = [startLoc];
    visited.add(key(startLoc));

    let count = 0;

    while (queue.length > 0 && count < MAX_CHAIN_COUNT) {
        const loc = queue.shift();
        const current = dim.getBlock(loc);

        if (!current || current.typeId !== targetTypeId) continue;

        action(dim, loc, current);
        count++;

        for (const off of NEIGHBOR_OFFSETS) {
            const next = {
                x: loc.x + off.x,
                y: loc.y + off.y,
                z: loc.z + off.z,
            };
            const k = key(next);

            if (visited.has(k)) continue;
            visited.add(k);

            const neighborBlock = dim.getBlock(next);
            if (neighborBlock && neighborBlock.typeId === targetTypeId) {
                queue.push(next);
            }
        }
    }
    return count;
}

// ワールド起動時にカスタムアイテムコンポーネントを登録する
system.beforeEvents.startup.subscribe((initEvent) => {
    initEvent.itemComponentRegistry.registerCustomComponent("hraddons:manaita_hoe", {

        /**
         * 右クリックでブロックに使用した時の処理。
         * 土・草ブロックの上が空いていれば、farmland（農地）に変換する。
         */
        onUseOn(event) {
            const { block } = event;
            if (!block) return;

            const dim = block.dimension;
            const loc = block.location;
            const id = block.typeId;

            // 対象外のブロックなら何もしない
            if (!pathTargets.includes(id)) return;

            // 真上にブロックがある場合は耕せない（バニラの挙動に合わせる）
            const above = dim.getBlock({ x: loc.x, y: loc.y + 1, z: loc.z });
            if (above && above.typeId !== "minecraft:air") return;

            dim.runCommand(
                `fill ${loc.x} ${loc.y} ${loc.z} ${loc.x} ${loc.y} ${loc.z} minecraft:farmland`
            );
        },

        /**
         * ブロックを破壊した時の処理。
         * 破壊したブロックが「is_hoe_item_destructible」タグを持つ場合のみ、
         * 隣接する（斜めも含む）同じブロックを連鎖的に破壊する。
         */
        onMineBlock(event) {
            const { block, minedBlockPermutation } = event;
            if (!block) return;

            // タグを持たないブロックは対象外にする
            if (!minedBlockPermutation.hasTag(DESTRUCTIBLE_TAG)) return;

            const targetTypeId = minedBlockPermutation.type.id;
            const dim = block.dimension;
            const startLoc = block.location;

            // 起点ブロック自体はプレイヤーの操作で既に破壊済みなので、
            // 周囲26方向それぞれを起点としてBFS連鎖破壊を開始する
            for (const off of NEIGHBOR_OFFSETS) {
                const pos = {
                    x: startLoc.x + off.x,
                    y: startLoc.y + off.y,
                    z: startLoc.z + off.z,
                };

                chainProcess(dim, pos, targetTypeId, (d, loc) => {
                    // ドロップアイテム・破壊パーティクル・サウンドを伴って破壊する
                    d.runCommand(`setblock ${loc.x} ${loc.y} ${loc.z} air destroy`);
                });
            }
        },
    });
});