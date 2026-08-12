import { system, BlockPermutation } from "@minecraft/server";
import { chainProcess, MassDestruction } from "./chainBreak";

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

            // 起点ブロック自体はプレイヤーの操作で既に破壊済みなので、
            // その周囲6方向それぞれを起点としてBFS連鎖破壊を開始する
            MassDestruction(block.dimension, block.location, targetTypeId);
        },
    });
});