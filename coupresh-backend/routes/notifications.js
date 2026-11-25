const express = require('express');
const authenticate = require('../middleware/auth');
const StudentNotification = require('../models/StudentNotification');

const createNotificationRouter = ({
  NotificationModel = StudentNotification,
} = {}) => {
  const router = express.Router();

  router.get('/me/notifications', authenticate, async (req, res) => {
    try {
      const notifications = await NotificationModel.findAll({
        where: { studentId: req.studentId },
        order: [['createdAt', 'DESC']],
        limit: 50,
      });
      return res.json({
        unreadCount: notifications.filter((notification) => !notification.readAt).length,
        notifications: notifications.map((notification) => ({
          id: notification.id,
          title: notification.title,
          message: notification.message,
          stageDays: notification.stageDays,
          emailStatus: notification.emailStatus,
          readAt: notification.readAt,
          createdAt: notification.createdAt,
        })),
      });
    } catch (error) {
      console.error('Loading student notifications failed:', error.message);
      return res.status(500).json({ message: 'Could not load notifications' });
    }
  });

  router.patch('/me/notifications/:notificationId/read', authenticate, async (req, res) => {
    try {
      const [updated] = await NotificationModel.update(
        { readAt: new Date() },
        {
          where: {
            id: req.params.notificationId,
            studentId: req.studentId,
            readAt: null,
          },
        },
      );
      if (!updated) {
        const existing = await NotificationModel.findOne({
          where: {
            id: req.params.notificationId,
            studentId: req.studentId,
          },
        });
        if (!existing) return res.status(404).json({ message: 'Notification not found' });
        return res.json({ message: 'Notification already marked as read' });
      }
      return res.json({ message: 'Notification marked as read' });
    } catch (error) {
      console.error('Marking student notification read failed:', error.message);
      return res.status(500).json({ message: 'Could not update notification' });
    }
  });

  return router;
};

module.exports = createNotificationRouter;
