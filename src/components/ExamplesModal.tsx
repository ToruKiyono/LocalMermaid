import { Button, Modal } from 'antd';
import type { MermaidExample } from '../data/examples';
import styles from '../styles/App.module.css';

interface ExamplesModalProps {
  open: boolean;
  examples: MermaidExample[];
  onSelect: (example: MermaidExample) => void;
  onClose: () => void;
}

export function ExamplesModal({ open, examples, onSelect, onClose }: ExamplesModalProps) {
  return (
    <Modal title="示例库" open={open} onCancel={onClose} footer={null} width={900}>
      <div className={styles.examplesGrid}>
        {examples.map((example) => (
          <div key={example.id} className={styles.exampleCard}>
            <span className={styles.exampleName}>{example.name}</span>
            <span className={styles.status}>{example.description}</span>
            <Button type="primary" onClick={() => onSelect(example)}>
              使用此示例
            </Button>
          </div>
        ))}
      </div>
    </Modal>
  );
}
