import { IsBoolean, IsDate, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";
import { Type, Transform } from "class-transformer"
import { parseBooleanValidator } from "../helpers";

export class PaginateDataTableDTO {
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    @Max(9999)
    offset: number = 1;

    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    @Min(1)
    @Max(50)
    count: number = 10;

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    from: Date = new Date("2000-01-01");

    @IsOptional()
    @IsDate()
    @Type(() => Date)
    to: Date = new Date()

    @IsOptional()
    @IsBoolean()
    @Transform(parseBooleanValidator)
    testMode: boolean = true;

    @IsOptional()
    @IsString()
    @Transform((param) => String(param.value).trim())
    query: string = "";
}