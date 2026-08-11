import { system, BlockPermutation } from "@minecraft/server";

// 原木ブロックと、対応する「皮を剥いだ」ブロックの対応表。
const stripMap = {
    "minecraft:oak_log": "minecraft:stripped_oak_log",
    "minecraft:spruce_log": "minecraft:stripped_spruce_log",
    "minecraft:birch_log": "minecraft:stripped_birch_log",
    "minecraft:jungle_log": "minecraft:stripped_jungle_log",
    "minecraft:acacia_log": "minecraft:stripped_acacia_log",
    "minecraft:dark_oak_log": "minecraft:stripped_dark_oak_log",
    "minecraft:mangrove_log": "minecraft:stripped_mangrove_log",
    "minecraft:cherry_log": "minecraft:stripped_cherry_log",
    "minecraft:pale_oak_log": "minecraft:stripped_pale_oak_log",
    "minecraft:crimson_stem": "minecraft:stripped_crimson_stem",
    "minecraft:warped_stem": "minecraft:stripped_warped_stem",
    "minecraft:oak_wood": "minecraft:stripped_oak_wood",
    "minecraft:spruce_wood": "minecraft:stripped_spruce_wood",
    "minecraft:birch_wood": "minecraft:stripped_birch_wood",
    "minecraft:jungle_wood": "minecraft:stripped_jungle_wood",
    "minecraft:acacia_wood": "minecraft:stripped_acacia_wood",
    "minecraft:dark_oak_wood": "minecraft:stripped_dark_oak_wood",
    "minecraft:mangrove_wood": "minecraft:stripped_mangrove_wood",
    "minecraft:cherry_wood": "minecraft:stripped_cherry_wood",
    "minecraft:pale_oak_wood": "minecraft:stripped_pale_oak_wood",
    "minecraft:crimson_hyphae": "minecraft:stripped_crimson_hyphae",
    "minecraft:warped_hyphae": "minecraft:stripped_warped_hyphae",
    "minecraft:bamboo_block": "minecraft:stripped_bamboo_block",
};

const LOG_AND_WOOD_IDS = new Set([
    ...Object.keys(stripMap),
    ...Object.values(stripMap),
]);

// 1回で処理できる上限
const MAX_CHAIN_COUNT = 200;

// 探索対象の座標(26方向)を自動生成する
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
    // 探索済み座標を記録するSet（同じ座標を何度もキューに入れないようにする）
    const visited = new Set();
    const key = (p) => `${p.x},${p.y},${p.z}`;

    // BFS用のキュー。まずは起点座標だけを入れておく
    const queue = [startLoc];
    visited.add(key(startLoc));

    let count = 0;

    while (queue.length > 0 && count < MAX_CHAIN_COUNT) {
        const loc = queue.shift();
        const current = dim.getBlock(loc);

        // ブロックが取得できない、または対象のブロックでなければスキップ
        if (!current || current.typeId !== targetTypeId) continue;

        // 対象ブロックに対する実処理（剥皮 or 破壊）を実行
        action(dim, loc, current);
        count++;

        // このブロックの周囲6方向を調べ、同じブロックがあればキューに追加
        for (const off of NEIGHBOR_OFFSETS) {
            const next = {
                x: loc.x + off.x,
                y: loc.y + off.y,
                z: loc.z + off.z,
            };
            const k = key(next);

            // 既に探索済みの座標は無視（無限ループ防止）
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
    initEvent.itemComponentRegistry.registerCustomComponent("hraddons:manaita_axe", {
        // 右クリックでブロックに使用した時の処理
        onUseOn(event) {
            const { block } = event;
            if (!block) return;

            const originId = block.typeId;

            // stripMapに存在しないブロック（剥皮対象外）なら何もしない
            if (!(originId in stripMap)) return;

            const dim = block.dimension;
            const startLoc = block.location;

            // 連鎖的に剥皮処理を実行
            const count = chainProcess(dim, startLoc, originId, (d, loc, current) => {
                // 剥皮後も丸太の向き（軸）を維持するため、現在のpillar_axisを引き継ぐ
                const axis = current.permutation.getState("pillar_axis");
                const newPerm = BlockPermutation.resolve(stripMap[originId], {
                    "pillar_axis": axis,
                });
                d.getBlock(loc).setPermutation(newPerm);
            });

            // 1ブロック以上処理した場合のみ、剥皮音を1回だけ再生
            if (count > 0) {
                dim.runCommand(
                    `playsound item.axe.strip @a ${startLoc.x + 0.5} ${startLoc.y + 0.5} ${startLoc.z + 0.5}`
                );
            }
        },

        // ブロックを破壊した時の処理。
        onMineBlock(event) {
            const { block, minedBlockPermutation } = event;
            if (!block) return;

            const targetTypeId = minedBlockPermutation.type.id;
            if (!LOG_AND_WOOD_IDS.has(targetTypeId)) return;
            const dim = block.dimension;
            const startLoc = block.location;

            // 起点ブロック自体はプレイヤーの操作で既に破壊済みなので、
            // その周囲6方向それぞれを起点としてBFS連鎖破壊を開始する
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