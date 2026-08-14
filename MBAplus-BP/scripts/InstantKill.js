import { system } from "@minecraft/server";

system.beforeEvents.startup.subscribe((initEvent) => {
    initEvent.itemComponentRegistry.registerCustomComponent("hraddons:InstantKill", {
        onHitEntity(event){
            const { hitEntity } = event;
            if (!hitEntity) return;
            try {
                hitEntity.kill();
            } catch (e){}
        }
    })
})