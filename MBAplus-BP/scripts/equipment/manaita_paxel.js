import { system } from "@minecraft/server";
import { MassDestruction } from "./chainBreak";

/* ===================== 斧（剥皮）関連 ===================== */

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

/* ===================== クワ（一括破壊）関連 ===================== */

// クワ由来の一括破壊対象タグ
const HOE_DESTRUCTIBLE_TAG = "minecraft:is_hoe_item_destructible";

/* ===================== ツルハシ（鉱石）関連 ===================== */

// 一括破壊の対象とする「鉱石」ブロックの一覧
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

/* ===================== 剣関連 ===================== */

const SWORD_DESTRUCTIBLE_TAG = "minecraft:is_sword_item_destructible";

// ワールド起動時にカスタムアイテムコンポーネントを登録する
system.beforeEvents.startup.subscribe((initEvent) => {
    initEvent.itemComponentRegistry.registerCustomComponent("hraddons:manaita_paxel", {

        // ブロックを破壊した時の処理（斧・クワ・ツルハシ・剣の一括破壊を統合）
        onMineBlock(event) {
            const { block, minedBlockPermutation } = event;
            if (!block) return;

            const targetTypeId = minedBlockPermutation.type.id;
            const dim = block.dimension;
            const startLoc = block.location;

            // --- 原木・木材の連鎖破壊（斧）---
            if (LOG_AND_WOOD_IDS.has(targetTypeId)) {
                MassDestruction(dim, startLoc, targetTypeId);
                return;
            }

            // --- 鉱石の連鎖破壊（ツルハシ）---
            if (ORE_BLOCK_IDS.has(targetTypeId)) {
                MassDestruction(dim, startLoc, targetTypeId);
                return;
            }

            // --- タグ付きブロックの連鎖破壊（クワ / 剣）---
            if (
                minedBlockPermutation.hasTag(HOE_DESTRUCTIBLE_TAG) ||
                minedBlockPermutation.hasTag(SWORD_DESTRUCTIBLE_TAG)
            ) {
                MassDestruction(dim, startLoc, targetTypeId);
                return;
            }
        },
    });
});