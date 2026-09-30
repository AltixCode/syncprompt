import { VIDEO_RATIOS, ratioToVideoQuality } from "../videoSettings";

describe("ratioToVideoQuality", () => {
  it("maps the widescreen preset to a 16:9 recording quality", () => {
    expect(ratioToVideoQuality("16:9")).toBe("1080p");
  });

  it("maps the classic preset to the 4:3 recording quality", () => {
    expect(ratioToVideoQuality("4:3")).toBe("4:3");
  });

  it("falls back to 16:9 for an unrecognised ratio rather than throwing", () => {
    // @ts-expect-error -- deliberately passing a value outside VideoRatio
    expect(ratioToVideoQuality("9:16")).toBe("1080p");
  });

  it("exposes exactly the two presets the prompter screen offers", () => {
    expect(VIDEO_RATIOS).toEqual(["16:9", "4:3"]);
  });
});
