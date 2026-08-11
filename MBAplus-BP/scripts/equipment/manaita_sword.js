import { system } from "@minecraft/server";

const DESTRUCTIBLE_TAG = "minecraft:is_sword_item_destructible";

const MAX_CHAIN_COUNT = 200;

const NEIGHBOR_OFFSETS = (() => {
    const offsets = [];
    for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
            for (let z = -1; z <= 1; z++) {
                if (x === 0 && y === 0 && z === 0) continue;
                offsets.push({ x, y, z });
            }
        }
    }
    return offsets;
})();

function chainProcess(dim, startLoc, targetTypeId, action) {
    const visited = new Set();
    const key = (p) => `${p.x},${p.y},${p.z}`;

    const queue = [startLoc];
    visited.add(key(startLoc));

    let count = 0;

    while (queue.length > 0 && count < MAX_CHAIN_COUNT) {
        const loc = queue.shift();
        const current = dim.getBlock(loc);

        if (!current || current.typeId !== targetTypeId) continue;

        action(dim, loc, current);
        count++;

        for (const off of NEIGHBOR_OFFSETS) {
            const next = {
                x: loc.x + off.x,
                y: loc.y + off.y,
                z: loc.z + off.z,
            };
            const k = key(next);

            if (visited.has(k)) continue;
            visited.add(k);

            const neighborBlock = dim.getBlock(next);
            if (neighborBlock && neighborBlock.typeId === targetTypeId) {
                queue.push(next);
            }
        }
    }
    return count;
}

system.beforeEvents.startup.subscribe((initEvent) => {
    initEvent.itemComponentRegistry.registerCustomComponent("hraddons:manaita_sword", {
        onMineBlock(event) {
            const { block, minedBlockPermutation } = event;
            if (!block) return;
            if (!minedBlockPermutation.hasTag(DESTRUCTIBLE_TAG)) return;
            const targetTypeId = minedBlockPermutation.type.id;
            const dim = block.dimension;
            const startLoc = block.location;

            for (const off of NEIGHBOR_OFFSETS) {
                const next = {
                    x: startLoc.x + off.x,
                    y: startLoc.y + off.y,
                    z: startLoc.z + off.z,
                };
                chainProcess(dim, next, targetTypeId, (dim, loc, current) => {
                    dim.runCommand(`setblock ${loc.x} ${loc.y} ${loc.z} air destroy`);
                });
            }
        }
    })
})