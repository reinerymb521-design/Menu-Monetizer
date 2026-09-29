import { Router, type IRouter } from "express";
import healthRouter from "./health";
import librosRouter from "./libros";
import perfilesRouter from "./perfiles";

const router: IRouter = Router();

router.use(healthRouter);
router.use(librosRouter);
router.use(perfilesRouter);

export default router;
