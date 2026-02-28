import { system, ItemStack } from "@minecraft/server";
import { incClk, noIncItems } from "./config";

system.beforeEvents.startup.subscribe((initEvent) => {
    initEvent.itemComponentRegistry.registerCustomComponent("hraddons:manaita_clicks",{
        onUseOn(event) {
        const { block, itemStack } = event;
        const player = event.source;
        if (!block || !itemStack) return;

        if (!(itemStack.typeId in incClk)) return;
        if (noIncItems.includes(block.typeId)){
            if(player && player.sendMessage){
                player.sendMessage("§a[warning]このブロックは増やせません");
            }
            return;
        }

        const totalAmount = 2 ** incClk[itemStack.typeId];
        const maxStackSize = itemStack.getMaxStackSize?.() ?? 64;

        const spawnLocation = {
            x: block.location.x + 0.5,
            y: block.location.y + 0.5,
            z: block.location.z + 0.5,
        };

        let remaining = totalAmount;

        while (remaining > 0) {
            const spawnAmount = Math.min(remaining, maxStackSize);

            const blockItem = new ItemStack(block.typeId, spawnAmount);
            block.dimension.spawnItem(blockItem, spawnLocation);

            remaining -= spawnAmount;
        }},
    });
});
