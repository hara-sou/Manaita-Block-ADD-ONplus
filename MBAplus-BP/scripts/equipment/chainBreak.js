/**
 * 一括破壊（連鎖処理）で共通して使う定数・関数をまとめたモジュール。
 * manaita_axe / manaita_hoe / manaita_pickaxe / manaita_sword で共有する。
 */

// 1回の連鎖処理で処理できるブロック数の上限。
export const MAX_CHAIN_COUNT = 200;

// 3x3x3の立方体から中心(0,0,0)を除いた26方向（斜めも含む）を自動生成する。
export const NEIGHBOR_OFFSETS = (() => {
    const offsets = [];
    for (let x = -1; x <= 1; x++) {
        for (let y = -1; y <= 1; y++) {
            for (let z = -1; z <= 1; z++) {
                if (x === 0 && y === 0 && z === 0) continue; // 中心（自分自身）は除外
                offsets.push({ x, y, z });
            }
        }
    }
    return offsets;
})();


//指定座標を起点に、同じtypeIdのブロックをBFSで連鎖的に処理する。
export function chainProcess(dim, startLoc, targetTypeId, action) {
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


// onMineBlockイベント用の共通ヘルパー。
export function MassDestruction(dim, startLoc, targetTypeId, destroyAction) {
    const action =
        destroyAction ??
        ((d, loc) => {
            // ドロップアイテム・破壊パーティクル・サウンドを伴って破壊する
            d.runCommand(`setblock ${loc.x} ${loc.y} ${loc.z} air destroy`);
        });

    let total = 0;
    for (const off of NEIGHBOR_OFFSETS) {
        const pos = {
            x: startLoc.x + off.x,
            y: startLoc.y + off.y,
            z: startLoc.z + off.z,
        };
        total += chainProcess(dim, pos, targetTypeId, action);
    }
    return total;
}