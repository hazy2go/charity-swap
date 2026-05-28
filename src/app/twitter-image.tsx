// twitter-image — re-uses the opengraph generator so both meta cards stay
// identical. Twitter expects 1200×630 too, so the size export below matches.
import OpengraphImage from "./opengraph-image";

export const runtime = "edge";
export const alt =
  "Swaps without Borders — cross-chain swaps where 100% of fees go to charity";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default OpengraphImage;
