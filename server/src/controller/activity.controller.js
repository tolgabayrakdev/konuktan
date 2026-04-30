import { ActivityService } from '../service/activity.service.js';

export class ActivityController {
  constructor() {
    this.service = new ActivityService();
  }

  list = async (req, res, next) => {
    try {
      const { customerId, type, startDate, endDate, page = 1, limit = 30 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);
      const result = await this.service.list({
        userId: req.user.id,
        customerId,
        type,
        startDate,
        endDate,
        limit: Number(limit),
        offset,
      });
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  };

  create = async (req, res, next) => {
    try {
      const data = await this.service.create(req.user.id, req.body);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  update = async (req, res, next) => {
    try {
      const data = await this.service.update(req.params.id, req.user.id, req.body);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req, res, next) => {
    try {
      await this.service.delete(req.params.id, req.user.id);
      res.status(200).json({ success: true, data: { message: 'Aktivite silindi' } });
    } catch (err) {
      next(err);
    }
  };
}
