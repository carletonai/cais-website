const React = require("react");
const PropTypes = require("prop-types");

const motionProps = new Set([
  "animate",
  "drag",
  "exit",
  "initial",
  "layout",
  "transition",
  "variants",
  "viewport",
  "whileHover",
  "whileInView",
  "whileTap",
]);

const createMotionValue = (value = 0) => ({
  get: () => value,
  getPrevious: () => value,
  on: () => () => {},
  set: () => {},
});

const sanitizeStyle = (style) => {
  if (!style) return style;

  return Object.fromEntries(
    Object.entries(style).map(([key, value]) => [
      key,
      value && typeof value.get === "function" ? value.get() : value,
    ]),
  );
};

const createMotionComponent = (tag) => {
  const MotionComponent = React.forwardRef(function MotionComponent(
    { children, style, ...props },
    ref,
  ) {
    const domProps = Object.fromEntries(
      Object.entries(props).filter(([key]) => !motionProps.has(key)),
    );

    return React.createElement(
      tag,
      { ...domProps, ref, style: sanitizeStyle(style) },
      children,
    );
  });
  MotionComponent.displayName = `motion.${String(tag)}`;
  MotionComponent.propTypes = {
    children: PropTypes.node,
    style: PropTypes.object,
  };

  return MotionComponent;
};

const motion = new Proxy(
  {},
  {
    get: (_target, tag) => createMotionComponent(tag),
  },
);

const AnimatePresence = ({ children }) =>
  React.createElement(React.Fragment, null, children);
AnimatePresence.propTypes = {
  children: PropTypes.node,
};

const useScroll = () => ({
  scrollY: createMotionValue(0),
  scrollYProgress: createMotionValue(0),
});

const useSpring = (value) => value;
const useTransform = (_value, _input, output) =>
  Array.isArray(output) ? output[0] : output;
const useMotionValueEvent = () => {};

module.exports = {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
};
