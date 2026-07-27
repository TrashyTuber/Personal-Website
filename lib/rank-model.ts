/**
 * Log-normal model of a minesweeper.online best-time leaderboard, fitted from
 * a handful of hand-sampled (rank, seconds) anchors. Best-time distributions
 * are close to log-normal; with anchors z-transformed through the normal
 * quantile, the fit reduces to a two-parameter linear regression.
 *
 * Honesty contract: every number this module emits is an ESTIMATE
 * extrapolated from top-of-curve anchors — callers must present results with
 * ≈/~ markers, never as exact standings.
 */

export interface RankModel {
  /** Mean of ln(seconds) across ranked players. */
  mu: number;
  /** Standard deviation of ln(seconds). */
  sigma: number;
}

export interface Standing {
  /** Estimated fraction of ranked players at or above this time (0..1]. */
  percent: number;
  /** Estimated leaderboard rank, clamped to [1, playerCount]. */
  rank: number;
}

/** Standard normal CDF via the Abramowitz–Stegun 7.1.26 erf approximation. */
export function phi(x: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(x) / Math.SQRT2);
  const erf =
    1 -
    t *
      (0.254829592 +
        t *
          (-0.284496736 +
            t * (1.421413741 + t * (-1.453152027 + t * 1.061405429)))) *
      Math.exp((-x * x) / 2);
  return x >= 0 ? 0.5 * (1 + erf) : 0.5 * (1 - erf);
}

/**
 * Standard normal quantile (probit), Acklam's rational approximation.
 * Only needed at fit time, where inputs are deep-tail probabilities.
 */
function probit(p: number): number {
  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.38357751867269e2, -3.066479806614716e1, 2.506628277459239,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
    -2.549732539343734, 4.374664141464968, 2.938163982698783,
  ];
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996,
    3.754408661907416,
  ];
  const pLow = 0.02425;
  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }
  if (p <= 1 - pLow) {
    const q = p - 0.5;
    const r = q * q;
    return (
      ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) *
        q) /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
    );
  }
  const q = Math.sqrt(-2 * Math.log(1 - p));
  return -(
    (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
    ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  );
}

/**
 * Fit ln(seconds) = mu + sigma·probit(rank / playerCount) by least squares
 * over the anchors. Rank r is treated as "r of playerCount players are at or
 * below this time" — exact enough at leaderboard scale.
 */
export function fitLogNormal(
  anchors: [rank: number, seconds: number][],
  playerCount: number,
): RankModel {
  const zs = anchors.map(([rank]) => probit(rank / playerCount));
  const ys = anchors.map(([, seconds]) => Math.log(seconds));
  const n = anchors.length;
  const zMean = zs.reduce((s, z) => s + z, 0) / n;
  const yMean = ys.reduce((s, y) => s + y, 0) / n;
  let cov = 0;
  let varZ = 0;
  for (let i = 0; i < n; i++) {
    cov += (zs[i] - zMean) * (ys[i] - yMean);
    varZ += (zs[i] - zMean) ** 2;
  }
  const sigma = cov / varZ;
  return { mu: yMean - sigma * zMean, sigma };
}

export function estimateStanding(
  seconds: number,
  model: RankModel,
  playerCount: number,
): Standing {
  const s = Math.max(seconds, 0.001);
  const percent = phi((Math.log(s) - model.mu) / model.sigma);
  const rank = Math.min(
    playerCount,
    Math.max(1, Math.round(percent * playerCount)),
  );
  return { percent, rank };
}

/**
 * "≈ top 0.8% on minesweeper.online (~#31,000 of 3.7M)" — every figure
 * carries an approximation marker, ranks round to two significant figures,
 * and past the 90th percentile the (deflating) detail is dropped.
 */
export function formatStanding(standing: Standing, playerCount: number): string {
  const p = standing.percent * 100;
  if (p > 90) return '≈ top 90%+ on minesweeper.online';
  const percentLabel =
    p < 0.001
      ? 'top 0.001%'
      : p < 1
        ? `top ${Number(p.toPrecision(1))}%`
        : `top ${Math.round(p)}%`;
  const rank = Number(standing.rank.toPrecision(2)).toLocaleString('en-US');
  const total = `${(playerCount / 1e6).toFixed(1)}M`;
  return `≈ ${percentLabel} on minesweeper.online (~#${rank} of ${total})`;
}
