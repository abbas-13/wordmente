import styles from './Toast.module.css';

interface ToastProps {
  /** Why the last guess was rejected; nothing renders without one. */
  message?: string;
}

/**
 * Feedback for a rejected guess.
 *
 * The element is always in the DOM with `role="status"`, because a live region
 * only announces changes if it already existed when the text arrives.
 */
const Toast = ({ message }: ToastProps) => (
  <p className={styles.toast} role="status">
    {message || null}
  </p>
);

export default Toast;
