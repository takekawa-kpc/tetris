import { expect, test, type Locator, type Page } from "@playwright/test";

const SPECIES = ["I", "O", "T", "S", "Z", "J", "L"] as const;
type Species = (typeof SPECIES)[number];

// §3.2 既定カラー
const COLOR_NAMES: Record<Species, string> = {
  I: "cyan",
  O: "yellow",
  T: "purple",
  S: "green",
  Z: "red",
  J: "blue",
  L: "orange",
};

// §5.2 の 0° オフセットと §3.4 の出現位置(x = floor((10 - 幅) / 2), y = 0)から導いた [y, x]
const EXPECTED_CELLS: Record<Species, readonly [number, number][]> = {
  I: [
    [1, 3],
    [1, 4],
    [1, 5],
    [1, 6],
  ],
  O: [
    [0, 4],
    [0, 5],
    [1, 4],
    [1, 5],
  ],
  T: [
    [0, 4],
    [1, 3],
    [1, 4],
    [1, 5],
  ],
  S: [
    [0, 4],
    [0, 5],
    [1, 3],
    [1, 4],
  ],
  Z: [
    [0, 3],
    [0, 4],
    [1, 4],
    [1, 5],
  ],
  J: [
    [0, 3],
    [1, 3],
    [1, 4],
    [1, 5],
  ],
  L: [
    [0, 5],
    [1, 3],
    [1, 4],
    [1, 5],
  ],
};

const EXPECTED_COLUMNS: Record<Species, number[]> = {
  I: [3, 4, 5, 6],
  O: [4, 5],
  T: [3, 4, 5],
  S: [3, 4, 5],
  Z: [3, 4, 5],
  J: [3, 4, 5],
  L: [3, 4, 5],
};

type SpawnWindow = Window & { __spawn?: (id: Species) => void };

const cell = (page: Page, y: number, x: number): Locator => page.getByTestId(`cell-${y}-${x}`);
const allCells = (page: Page): Locator => page.getByTestId("board").getByTestId(/^cell-\d+-\d+$/);
const emptyCells = (page: Page): Locator => page.locator('[data-testid="board"] [data-piece=""]');

function namedColor(el: Element): string {
  const raw = getComputedStyle(el).backgroundColor;
  const m = raw.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) throw new Error(`色を取得できません: ${raw}`);
  const [r, g, b] = [Number(m[1]), Number(m[2]), Number(m[3])].map((v) => v / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const lightness = (max + min) / 2;
  if (lightness > 0.85) return "white";
  if (lightness < 0.12) return "black";
  const delta = max - min;
  if (delta / (1 - Math.abs(2 * lightness - 1)) < 0.35) return "gray";
  let hue = 0;
  if (max === r) hue = 60 * (((g - b) / delta) % 6);
  else if (max === g) hue = 60 * ((b - r) / delta + 2);
  else hue = 60 * ((r - g) / delta + 4);
  if (hue < 0) hue += 360;
  if (hue < 15 || hue >= 345) return "red";
  if (hue < 40) return "orange";
  if (hue < 75) return "yellow";
  if (hue < 170) return "green";
  if (hue < 200) return "cyan";
  if (hue < 255) return "blue";
  return "purple";
}

async function spawn(page: Page, id: Species): Promise<void> {
  await page.evaluate((piece) => (window as SpawnWindow).__spawn?.(piece), id);
}

test.describe("001 盤面とテトロミノ", () => {
  test("盤面は 10 列 × 20 行 = 200 セル", async ({ page }) => {
    await page.goto("/");
    await expect(allCells(page)).toHaveCount(200);
    for (let y = 0; y < 20; y++) await expect(cell(page, y, 0)).toBeVisible();
    for (let x = 0; x < 10; x++) await expect(cell(page, 0, x)).toBeVisible();
    await expect(emptyCells(page)).toHaveCount(200);
  });

  for (const id of SPECIES) {
    test(`${id} を出現させると 4 セルがその種の色で埋まる`, async ({ page }) => {
      await page.goto("/");
      await spawn(page, id);
      for (const [y, x] of EXPECTED_CELLS[id]) {
        const target = cell(page, y, x);
        await expect(target).toHaveAttribute("data-piece", id);
        expect(await target.evaluate(namedColor)).toBe(COLOR_NAMES[id]);
      }
      await expect(page.locator(`[data-testid="board"] [data-piece="${id}"]`)).toHaveCount(4);
      await expect(emptyCells(page)).toHaveCount(196);
    });
  }

  test("出現位置は中央帯(I: x=3〜6 / O: x=4〜5 / 3×3 種: x=3〜5)", async ({ page }) => {
    for (const id of SPECIES) {
      await page.goto("/");
      await spawn(page, id);
      const columns = new Set<number>();
      for (let y = 0; y < 2; y++) {
        for (let x = 0; x < 10; x++) {
          if (await cell(page, y, x).getAttribute("data-piece")) columns.add(x);
        }
      }
      expect([...columns].sort((a, b) => a - b)).toEqual(EXPECTED_COLUMNS[id]);
    }
  });
});
