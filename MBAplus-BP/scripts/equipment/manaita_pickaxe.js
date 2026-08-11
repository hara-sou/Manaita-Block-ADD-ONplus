import { system } from "@minecraft/server";

// 一括破壊の対象とする「鉱石」ブロックの一覧。
const ORE_BLOCK_IDS = new Set([
    "minecraft:coal_ore",
    "minecraft:deepslate_coal_ore",
    "minecraft:iron_ore",
    "minecraft:deepslate_iron_ore",
    "minecraft:copper_ore",
    "minecraft:deepslate_copper_ore",
    "minecraft:gold_ore",
    "minecraft:deepslate_gold_ore",
    "minecraft:redstone_ore",
    "minecraft:deepslate_redstone_ore",
    "minecraft:lit_redstone_ore",
    "minecraft:lapis_ore",
    "minecraft:deepslate_lapis_ore",
    "minecraft:diamond_ore",
    "minecraft:deepslate_diamond_ore",
    "minecraft:emerald_ore",
    "minecraft:deepslate_emerald_ore",
    "minecraft:nether_gold_ore",
    "minecraft:quartz_ore",
    "minecraft:ancient_debris",
]);

// 1回で処理できる上限
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
    initEvent.itemComponentRegistry.registerCustomComponent("hraddons:manaita_pickaxe", {

        // ブロックを破壊した時の処理。
        onMineBlock(event) {
            const { block, minedBlockPermutation } = event;
            if (!block) return;

            const targetTypeId = minedBlockPermutation.type.id;

            // 鉱石ブロック一覧に含まれないブロック（石・丸石など）は対象外
            if (!ORE_BLOCK_IDS.has(targetTypeId)) return;

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