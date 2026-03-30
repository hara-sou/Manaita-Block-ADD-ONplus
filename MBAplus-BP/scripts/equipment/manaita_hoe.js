import { system } from "@minecraft/server";

system.beforeEvents.startup.subscribe((initEvent) => {
    initEvent.itemComponentRegistry.registerCustomComponent("hraddons:manaita_hoe",{
        onUseOn(event){
            const {block} = event;
            if(!block) return;
            const dim = block.dimension;
            const loc = block.location;
            const id = block.typeId;
            const pathTargets = [
                "minecraft:dirt",
                "minecraft:grass_block",
                "minecraft:grass_path"
            ];
            if(!pathTargets.includes(id)) return;
            const above = dim.getBlock({ x: loc.x, y: loc.y + 1, z: loc.z });
            if (above && above.typeId !== "minecraft:air") return;
            if(pathTargets.includes(id) == "minecaft:coarse_dirt"){
                dim.runCommand(
                    `fill ${loc.x} ${loc.y} ${loc.z} ${loc.x} ${loc.y} ${loc.z} minecraft:dirt`
                );
            }
            dim.runCommand(
            `fill ${loc.x} ${loc.y} ${loc.z} ${loc.x} ${loc.y} ${loc.z} minecraft:farmland`
            );
            }
        }
)});