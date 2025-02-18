import { BadRequestException } from "@nestjs/common";
import { Transform, Type } from "class-transformer";
import { IsBoolean, IsDate, IsOptional, ValidateIf } from "class-validator"
import { parseBooleanValidator } from "src/shared/helpers";

export class GetInsightsDTO {
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    from: Date = new Date(2020,0,1)

    
    @IsOptional()
    @IsDate()
    @Type(() => Date)
    @ValidateIf((obj, value) => {
        const result = new Date(obj.from) < new Date(value)
        if (!result)
            throw new BadRequestException("to date must be greater than from date")
        return result
    }, {
        always: true,
    })
    to: Date = new Date()

    @IsBoolean()
    @Transform(parseBooleanValidator)
    inHours: boolean = false

    @IsOptional()
    @IsBoolean()
    @Transform(parseBooleanValidator)
    testMode: boolean = true;
}