import { system, world, EquipmentSlot, BlockPermutation } from "@minecraft/server";

/*ノックバック無効化*/
world.afterEvents.entityHurt.subscribe(ev => {
  if (!(ev.hurtEntity.typeId === "minecraft:player")) return;
    const player = ev.hurtEntity;
    const equippable = player.getComponent("minecraft:equippable");
    const chest = equippable.getEquipment(EquipmentSlot.Chest);
  if (chest && chest.typeId === "hraddons:manaita_chest_knockback") {
    player.clearVelocity();
  }
});

/*オーブ生成*/
system.runInterval(() => {
  for (const player of world.getPlayers()) {
    const equip = player.getComponent("equippable");
    if (!equip) continue;
    const offhand = equip.getEquipment(EquipmentSlot.Offhand);
    if (!offhand || offhand.typeId !== "hraddons:manaita_xp_card_orb") continue;
    player.dimension.spawnEntity("minecraft:xp_orb", player.location);
  }
}, 1);

/*経験値リセット*/
world.afterEvents.itemUse.subscribe(ev => {
  if(ev.itemStack.typeId == "hraddons:manaita_xp_card"){
    ev.source.runCommand("xp -24791L @s")
    ev.source.sendMessage("§a" + ev.source.name + "の経験値をリセットしました")
  }
});

/*シャベル*/
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

/*クワ*/
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

/*斧*/
system.beforeEvents.startup.subscribe((initEvent) => {
    initEvent.itemComponentRegistry.registerCustomComponent("hraddons:manaita_axe", {
        onUseOn(event) {
            const { block } = event;
            if (!block) return;
            const id = block.typeId;
            const dim = block.dimension;
            const loc = block.location;
            /*原木と対応する剥皮ブロック */
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
            if (!(id in stripMap)) return;
            const axis = block.permutation.getState("pillar_axis");
            const newPerm = BlockPermutation.resolve(stripMap[id], {
                "pillar_axis": axis
            });
            dim.getBlock(loc).setPermutation(newPerm);
            dim.runCommand(
                `playsound item.axe.strip @a ${loc.x + 0.5} ${loc.y + 0.5} ${loc.z + 0.5}`
            );
        }
    });
});

/*弓*/
system.beforeEvents.startup.subscribe(ev => {
  ev.itemComponentRegistry.registerCustomComponent("hraddons:manaita_bow",{
      onUse(event) {
        const player = event.source;
        const hits = player.getEntitiesFromViewDirection({ maxDistance: 50 });
        if (hits.length === 0) return false;
        player.dimension.playSound("random.explode", player.location);
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

/*飛行用モジュール*/
const flyingPlayers = new Set();
world.afterEvents.itemUse.subscribe(ev => {
  if (ev.itemStack.typeId === "hraddons:manaita_module_fly") {
    const player = ev.source;
    try{
      if(!flyingPlayers.has(player.id)){
        // OFF -> ON
        player.runCommand("ability @s mayfly true");
        flyingPlayers.add(player.id);
      } else {
        // ON -> OFF
        player.runCommand("ability @s mayfly false");
        flyingPlayers.delete(player.id);
        }
      } catch {
        player.sendMessage("§c[error]このアイテムは現在使用できません。権限またはMinecraft Educationがオンになっているかを確認してください。");
      }
    }
});