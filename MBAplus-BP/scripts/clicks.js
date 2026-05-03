import { system, ItemStack } from "@minecraft/server";
import { incClk, noIncList } from "./config";

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

                // ★ まずチェスト本体をドロップ
                const chestItem = new ItemStack(block.typeId, spawnAmount);
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