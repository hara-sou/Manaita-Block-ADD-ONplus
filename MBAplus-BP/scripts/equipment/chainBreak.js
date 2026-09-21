import { system } from "@minecraft/server";

// ========== 隣接するブロックを検知する処理 ==========
export const MAX_CHAIN_COUNT = 640;
// 3x3x3の立方体から中心(0,0,0)を除いた26方向（斜めも含む）を自動生成する。
export const NEIGHBOR_OFFSETS = (() => {
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

// レッドストーン鉱石はlit(点灯)状態でtypeIdが変わるため、
// 通常/深層岩それぞれで lit と unlit を同一グループとして扱う。
const REDSTONE_GROUPS = [
    new Set(["minecraft:redstone_ore", "minecraft:lit_redstone_ore"]),
    new Set(["minecraft:deepslate_redstone_ore", "minecraft:lit_deepslate_redstone_ore"]),
];

// 指定typeIdが所属する「同一視すべきtypeIdの集合」を返す。
// 該当グループがなければ自分自身のみを含む集合を返す。
function getMatchGroup(typeId) {
    for (const group of REDSTONE_GROUPS) {
        if (group.has(typeId)) return group;
    }
    return new Set([typeId]);
}

//指定座標を起点に、targetTypeIds（同一視するtypeIdの集合）に含まれるブロックをBFSで連鎖的に処理する。
export function chainProcess(dim, startLoc, targetTypeIds, action) {
    const visited = new Set();
    const key = (p) => `${p.x},${p.y},${p.z}`;
    const queue = [startLoc];
    visited.add(key(startLoc));
    let count = 0;

    while (queue.length > 0 && count < MAX_CHAIN_COUNT) {
        const loc = queue.shift();
        const current = dim.getBlock(loc);
        if (!current || !targetTypeIds.has(current.typeId)) continue;
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
            if (neighborBlock && targetTypeIds.has(neighborBlock.typeId)) {
                queue.push(next);
            }
        }
    }
    return count;
}


// onMineBlockイベント用の共通ヘルパー。
export function MassDestruction(dim, startLoc, targetTypeId, destroyAction) {
    const action =
        destroyAction ??
        ((d, loc) => {
            // ドロップアイテム・破壊パーティクル・サウンドを伴って破壊する
            d.runCommand(`setblock ${loc.x} ${loc.y} ${loc.z} air destroy`);
        });

    const targetTypeIds = getMatchGroup(targetTypeId);

    let total = 0;
    for (const off of NEIGHBOR_OFFSETS) {
        const pos = {
            x: startLoc.x + off.x,
            y: startLoc.y + off.y,
            z: startLoc.z + off.z,
        };
        total += chainProcess(dim, pos, targetTypeIds, action);
    }
    return total;
}
// ==============================

// ---------- カテゴリ別の対象ブロック定義 ----------
const ore = new Set([
    "minecraft:coal_ore", "minecraft:deepslate_coal_ore",
    "minecraft:iron_ore", "minecraft:deepslate_iron_ore",
    "minecraft:copper_ore", "minecraft:deepslate_copper_ore",
    "minecraft:gold_ore", "minecraft:deepslate_gold_ore",
    "minecraft:redstone_ore", "minecraft:deepslate_redstone_ore", "minecraft:lit_redstone_ore", "minecraft:lit_deepslate_redstone_ore",// レッドストーンは必ずlitのブロックも入れる
    "minecraft:lapis_ore", "minecraft:deepslate_lapis_ore",
    "minecraft:diamond_ore", "minecraft:deepslate_diamond_ore",
    "minecraft:emerald_ore", "minecraft:deepslate_emerald_ore",
    "minecraft:nether_gold_ore", "minecraft:quartz_ore", "minecraft:ancient_debris",
]);

// shovel適正ブロック
const shovelBlocks = new Set([
    "minecraft:gravel"
]);

// hoe適正ブロック（バニラでもhoeで高速に採掘できるブロック群）
const hoeBlocks = ["minecraft:is_hoe_item_destructible"];

// sword適正ブロック
const swordBlocks = ["minecraft:is_sword_item_destructible"];

const axeBlocks = ["log"];
// ---------------------------------------------------

system.beforeEvents.startup.subscribe((initEvent) => {
    initEvent.itemComponentRegistry.registerCustomComponent("hraddons:mass_destruction", {
        onMineBlock(event) {
            const { block, minedBlockPermutation, itemStack } = event;
            if (!block || !itemStack) return;


            // 「まな板ティア」を持つツールでなければ一括破壊は発動しない
            if (!itemStack.hasTag("hraddons:manaita_tier")) return;

            const targetTypeId = minedBlockPermutation.type.id;

            // 掘ったブロックがどのカテゴリに属するか
            const isLogTarget = axeBlocks.some((tag) => minedBlockPermutation.hasTag(tag));
            const isOreTarget = ore.has(targetTypeId);
            const isShovelTarget = shovelBlocks.has(targetTypeId);
            const isHoeTarget = hoeBlocks.some((tag) => minedBlockPermutation.hasTag(tag));
            const isSwordTarget = swordBlocks.some((tag) => minedBlockPermutation.hasTag(tag));

            // ツールが持つ適性タグ
            const isAxe = itemStack.hasTag("minecraft:is_axe");
            const isHoe = itemStack.hasTag("minecraft:is_hoe");
            const isShovel = itemStack.hasTag("minecraft:is_shovel");
            const isPickaxe = itemStack.hasTag("minecraft:is_pickaxe");
            const isSword = itemStack.hasTag("minecraft:is_sword");
            const isPaxel = itemStack.hasTag("hraddons:is_paxel");

            //debug
            //console.warn(`tool=${itemStack.typeId} manaita=${itemStack.hasTag("hraddons:manaita_tier")} isHoe=${itemStack.hasTag("minecraft:is_hoe")} isPickaxe=${itemStack.hasTag("minecraft:is_pickaxe")} isShovel=${itemStack.hasTag("minecraft:is_shovel")} isSword=${itemStack.hasTag("minecraft:is_sword")}`);
            //console.warn(`block=${targetTypeId} isOre=${isOreTarget} isHoeTarget=${isHoeTarget} isShovelTarget=${isShovelTarget} isSwordTarget=${isSwordTarget}`);

            // ツールの適性 × ブロックのカテゴリが噛み合っているかを判定
            // paxelは4カテゴリすべてが対象
            const shouldDestroy =
                (isAxe && isLogTarget) ||
                (isHoe && isHoeTarget) ||
                (isShovel && isShovelTarget) ||
                (isPickaxe && isOreTarget) ||
                (isSword && isSwordTarget) ||
                (isPaxel && (isLogTarget || isOreTarget || isHoeTarget || isSwordTarget || isShovelTarget));

            if (!shouldDestroy) return;

            MassDestruction(block.dimension, block.location, targetTypeId);
        },
    });
});
