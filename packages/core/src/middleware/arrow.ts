import type {Middleware, Padding} from '../types';
import {getBasePlacement} from '../utils/getBasePlacement';
import {getLengthFromAxis} from '../utils/getLengthFromAxis';
import {getMainAxisFromPlacement} from '../utils/getMainAxisFromPlacement';
import {getSideObjectFromPadding} from '../utils/getPaddingObject';
import {within} from '../utils/within';

export type Options = {
  /**
   * The arrow element to be positioned.
   */
  element: any;
  /**
   * The padding between the arrow element and the floating element edges.
   * Useful when the floating element has rounded corners.
   */
  padding?: Padding;
};

/**
 * Positions an inner element of the floating element such that it is centered
 * to the reference element.
 */
export const arrow = (options: Options): Middleware => ({
  name: 'arrow',
  options,
  async fn(middlewareArguments) {
    // Since `element` is required, we don't Partial<> the type
    const {element, padding = 0} = options ?? {};
    const {x, y, placement, rects, platform} = middlewareArguments;

    if (element == null) {
      if (__DEV__) {
        console.warn(
          'Floating UI: No `element` was passed to the `arrow` middleware.'
        );
      }
      return {};
    }

    const paddingObject = getSideObjectFromPadding(padding);
    const coords = {x, y};
    const basePlacement = getBasePlacement(placement);
    const axis = getMainAxisFromPlacement(basePlacement);
    const length = getLengthFromAxis(axis);
    const arrowDimensions = await platform.getDimensions({element});
    const minProp = axis === 'y' ? 'top' : 'left';
    const maxProp = axis === 'y' ? 'bottom' : 'right';

    const endDiff =
      rects.reference[length] +
      rects.reference[axis] -
      coords[axis] -
      rects.floating[length];
    const startDiff = coords[axis] - rects.reference[axis];

    const arrowOffsetParent = await platform.getOffsetParent({element});
    const clientSize = arrowOffsetParent
      ? axis === 'y'
        ? arrowOffsetParent.clientHeight || 0
        : arrowOffsetParent.clientWidth || 0
      : 0;

    const centerToReference = endDiff / 2 - startDiff / 2;

    // Make sure the arrow doesn't overflow the floating element if the center
    // point is outside of the floating element's bounds
    const min = paddingObject[minProp];
    const max = clientSize - arrowDimensions[length] - paddingObject[maxProp];
    const center =
      clientSize / 2 - arrowDimensions[length] / 2 + centerToReference;
    const offset = within(min, center, max);

    return {
      data: {
        [axis]: offset,
        centerOffset: center - offset,
      },
    };
  },
});
