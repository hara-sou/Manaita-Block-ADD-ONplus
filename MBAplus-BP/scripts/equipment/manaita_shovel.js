import { system } from "@minecraft/server";

system.beforeEvents.startup.subscribe((initEvent) => {
    initEvent.itemComponentRegistry.registerCustomComponent("hraddons:manaita_shovel",{
        onUseOn(event) {
        const { block } = event;
        if (!block) return;
        const dim = block.dimension;
        const loc = block.location;
        const id = block.typeId;
        const pathTargets = [
            "minecraft:dirt",
            "minecraft:grass_block",
            "minecraft:podzol",
            "minecraft:coarse_dirt",
            "minecraft:mycelium",
            "minecraft:dirt_with_roots"
        ];
        if (!pathTargets.includes(id)) return;
        const above = dim.getBlock({ x: loc.x, y: loc.y + 1, z: loc.z });
        if (above && above.typeId !== "minecraft:air") return;
        dim.runCommand(
            `fill ${loc.x} ${loc.y} ${loc.z} ${loc.x} ${loc.y} ${loc.z} minecraft:grass_path`
        );}}
    );
});