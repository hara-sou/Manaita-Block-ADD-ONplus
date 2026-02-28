import { system, world, EquipmentSlot } from "@minecraft/server";

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

system.runInterval(() => {
  for (const player of world.getPlayers()) {
    const equip = player.getComponent("equippable");
    if (!equip) continue;
    const offhand = equip.getEquipment(EquipmentSlot.Offhand);
    if (!offhand || offhand.typeId !== "hraddons:manaita_xp_card_orb") continue;
    player.dimension.spawnEntity("minecraft:xp_orb", player.location);
  }
}, 1);

world.afterEvents.itemUse.subscribe(ev => {
  if(ev.itemStack.typeId == "hraddons:manaita_xp_card"){
    ev.source.runCommand("xp -24791L @s")
    ev.source.sendMessage("§a" + ev.source.name + "の経験値をリセットしました")
  }
});