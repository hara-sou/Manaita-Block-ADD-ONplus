import { system } from "@minecraft/server";
import { MassDestruction } from "./chainBreak";

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

            // 起点ブロック自体はプレイヤーの操作で既に破壊済みなので、
            // 周囲26方向それぞれを起点としてBFS連鎖破壊を開始する
            MassDestruction(block.dimension, block.location, targetTypeId);
        },
    });
});