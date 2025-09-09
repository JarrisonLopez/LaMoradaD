import { PartialType } from '@nestjs/mapped-types';
import { CreateEbookDto } from './create-ebook.dto';

/**
 * Hereda todas las props de CreateEbookDto pero opcionales:
 * title?, description?, price?, fileUrl?
 * Mantiene los @Transform y validaciones.
 */
export class UpdateEbookDto extends PartialType(CreateEbookDto) {}
