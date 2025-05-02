// src/components/PageWrapper.tsx
import { motion } from 'framer-motion';

const slideVariants = {
    initial: { opacity: 0, x: 100 }, // start off-screen to the right
    animate: { opacity: 1, x: 0 },   // slide into place
    exit: { opacity: 0, x: -100 },   // slide out to the left
};

const transition = {
    duration: 0.35,
    ease: 'easeInOut',
};

const PageWrapper = ({ children }: { children: React.ReactNode }) => (
    <motion.div
        variants={slideVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={transition}
        style={{ height: '100%' }}
    >
        {children}
    </motion.div>
);

export default PageWrapper;
