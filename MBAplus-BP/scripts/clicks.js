import { system, ItemStack } from "@minecraft/server";
import { incClk, noIncList } from "./config";

// ★ 鉱石ブロック → 原石アイテム の対応表
const oreDropMap = {
    // 石炭
    "minecraft:coal_ore":"minecraft:coal",
    "minecraft:deepslate_coal_ore":"minecraft:coal",
    // 銅
    "minecraft:copper_ore":"minecraft:raw_copper",
    "minecraft:deepslate_copper":"minecraft_raw_copper",
    // ラピスラズリ
    "minecraft:lapis_ore":"minecraft:lapis_lazuli",
    "minecraft:deepslate_lapis_ore":"minecraft:lapis_lazuli",
    // 鉄
    "minecraft:iron_ore": "minecraft:raw_iron",
    "minecraft:deepslate_iron_ore": "minecraft:raw_iron",
    // 金
    "minecraft:gold_ore":"minecraft:raw_gold",
    "minecraft:deepslate_gold_ore":"minecraft:raw_gold",
    // レッドストーン
    "minecraft:lit_redstone_ore":"minecraft:redstone",
    "minecraft:lit_deepslate_redstone_ore":"minecraft:redstone",
    // ダイヤモンド
    "minecraft:diamond_ore":"minecraft:diamond",
    "minecraft:deepslate_diamond_ore":"minecraft:diamond",
    // エメラルド
    "minecraft:emerald_ore":"minecraft:emerald",
    "minecraft:deepslate_emerald_ore":"minecraft:emerald",
    // ネザークォーツ
    "minecraft:quartz_ore":"minecraft:quartz",
    // ネザー金鉱石
    "minecraft:nether_gold_ore":"minecraft:gold_nugget",
    // 古代の残骸
    "minecraft:ancient_debris":"minecraft:netherite_scrap"
};

system.beforeEvents.startup.subscribe((initEvent) => {
    initEvent.itemComponentRegistry.registerCustomComponent("hraddons:manaita_clicks", {
        onUseOn(event) {
            const { block, itemStack } = event;
            const player = event.source;
            if (!block || !itemStack) return;

            if (!(itemStack.typeId in incClk)) return;
            if (noIncList().includes(block.typeId)) {
                player?.sendMessage?.("§e[warning]このブロックは増やせません");
                return;
            }

            const maxStackSize = itemStack.getMaxStackSize?.() ?? 64;

            const spawnLocation = {
                x: block.location.x + 0.5,
                y: block.location.y + 0.5,
                z: block.location.z + 0.5,
            };

            // ★ チェストなどのインベントリを取得
            const blockInv = block.getComponent("minecraft:inventory")?.container;

            let remaining = incClk[itemStack.typeId];;

            while (remaining > 0) {
                const spawnAmount = Math.min(remaining, maxStackSize);

                // ★ 鉱石ブロックの場合は原石を、それ以外はブロック自体をドロップ
                const dropTypeId = oreDropMap[block.typeId] ?? block.typeId;
                const chestItem = new ItemStack(dropTypeId, spawnAmount);
                block.dimension.spawnItem(chestItem, spawnLocation);

                // ★ 中身を spawnAmount 回分ドロップ
                if (blockInv) {
                    for (let i = 0; i < blockInv.size; i++) {
                        const slotItem = blockInv.getItem(i);
                        if (!slotItem) continue;

                        // スロットのアイテムを spawnAmount 回複製してドロップ
                        for (let n = 0; n < spawnAmount; n++) {
                            block.dimension.spawnItem(slotItem.clone(), spawnLocation);
                        }
                    }
                }

                remaining -= spawnAmount;
            }
        },
    });
});