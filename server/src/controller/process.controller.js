import { ProcessService } from '../service/process.service.js';

export class ProcessController {
  constructor() {
    this.service = new ProcessService();
  }

  list = async (req, res, next) => {
    try {
      const { customerId, stage, search, page, limit } = req.query;
      const result = await this.service.list({ userId: req.user.id, customerId, stage, search, page, limit });
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          page: result.page ?? 1,
          limit: result.limit ?? result.total,
          totalPages: result.totalPages ?? 1,
        },
      });
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
      res.status(200).json({ success: true, data: { message: 'Süreç silindi' } });
    } catch (err) {
      next(err);
    }
  };
}
