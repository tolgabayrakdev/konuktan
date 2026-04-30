import { CustomerService } from '../service/customer.service.js';

export class CustomerController {
  constructor() {
    this.service = new CustomerService();
  }

  list = async (req, res, next) => {
    try {
      const { search, status, page = 1, limit = 50 } = req.query;
      const result = await this.service.list({
        userId: req.user.id,
        search,
        status,
        page: Number(page),
        limit: Number(limit),
      });
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  };

  getOne = async (req, res, next) => {
    try {
      const customer = await this.service.getOne(req.params.id, req.user.id);
      res.status(200).json({ success: true, data: customer });
    } catch (err) {
      next(err);
    }
  };

  create = async (req, res, next) => {
    try {
      const customer = await this.service.create(req.user.id, req.body);
      res.status(201).json({ success: true, data: customer });
    } catch (err) {
      next(err);
    }
  };

  update = async (req, res, next) => {
    try {
      const customer = await this.service.update(req.params.id, req.user.id, req.body);
      res.status(200).json({ success: true, data: customer });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req, res, next) => {
    try {
      await this.service.delete(req.params.id, req.user.id);
      res.status(200).json({ success: true, data: { message: 'Müşteri silindi' } });
    } catch (err) {
      next(err);
    }
  };
}
