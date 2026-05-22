import { Router } from 'express';
import { authenticate, authorizeAdmin } from '../middlewares/authMiddleware';
import {
    listReminders,
    createReminder,
    getReminder,
    updateReminder,
    deleteReminder,
    sendReminderWa
} from '../controllers/reminderController';

const router = Router();

router.use(authenticate);
router.use(authorizeAdmin);

/**
 * @swagger
 * /reminders:
 *   get:
 *     summary: List reminders
 *     tags: [Reminders]
 */
router.get('/', listReminders);

/**
 * @swagger
 * /reminders:
 *   post:
 *     summary: Create a new reminder
 *     tags: [Reminders]
 */
router.post('/', createReminder);

/**
 * @swagger
 * /reminders/{id}:
 *   get:
 *     summary: Get reminder detail
 *     tags: [Reminders]
 */
router.get('/:id', getReminder);

/**
 * @swagger
 * /reminders/{id}:
 *   put:
 *     summary: Update reminder
 *     tags: [Reminders]
 */
router.put('/:id', updateReminder);

/**
 * @swagger
 * /reminders/{id}:
 *   delete:
 *     summary: Delete reminder (soft delete)
 *     tags: [Reminders]
 */
router.delete('/:id', deleteReminder);

/**
 * @swagger
 * /reminders/send-wa/{id}:
 *   post:
 *     summary: Send reminder via WhatsApp
 *     tags: [Reminders]
 */
router.post('/send-wa/:id', sendReminderWa);

export default router;
