/** Hearthstone-style backdrop layers:
 *    - body itself carries the tiled wood texture (in globals.css)
 *    - overhead glow + drifting haze + rising ember motes for life
 *    - sidebar ornaments (banners + sconces) flank the viewport
 *    - vignette pulls focus to the centre
 *  All layers are fixed, pointer-events:none. Sidebars hide below md.    */
export function Scenery() {
  return (
    <>
      <div aria-hidden className="scenery-layer scenery-overhead-glow" />
      <div aria-hidden className="scenery-layer scenery-haze" />
      <div aria-hidden className="scenery-layer scenery-motes" />
      <div aria-hidden className="scenery-layer scenery-motes-b" />
      <div aria-hidden className="scenery-layer scenery-vignette" />
      <div aria-hidden className="sidebar-ornament sidebar-ornament-left" />
      <div aria-hidden className="sidebar-ornament sidebar-ornament-right" />
    </>
  );
}
