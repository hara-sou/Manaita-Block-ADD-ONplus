import { system } from "@minecraft/server";

system.beforeEvents.startup.subscribe(ev => {
  ev.itemComponentRegistry.registerCustomComponent("hraddons:manaita_bow",{
      onUse(event) {
        const player = event.source;
        const hits = player.getEntitiesFromViewDirection({ maxDistance: 50 });
        if (hits.length === 0) return;
        const target = hits[0].entity;

        const start = player.getHeadLocation();
        const end = { ...target.location };

        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const dz = end.z - start.z;

        const steps = 20;
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const pos = {
            x: start.x + dx * t,
            y: start.y + dy * t,
            z: start.z + dz * t
          };

          player.dimension.spawnParticle(
            "minecraft:sonic_explosion",
            pos
          );
        }

        target.applyDamage(32767, {
          cause: "entityAttack",
          damagingEntity: player
        });
      }
    }
  );
});