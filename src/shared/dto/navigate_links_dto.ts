import { ApiProperty } from '@nestjs/swagger';
import { RESPONSE_TYPE } from '../constants';
import { Type } from 'class-transformer';
import { Min, IsOptional, Max, IsString } from 'class-validator';

export class WebLinkDto {
  @ApiProperty()
  href: string;

  @ApiProperty()
  type: string;

  constructor(href: string, type: string = RESPONSE_TYPE.HTML) {
    this.href = href;
    this.type = type;
  }
}

export class NaviagateLinksDto {
  @ApiProperty()
  self: WebLinkDto;

  @ApiProperty()
  documentation: WebLinkDto;

  constructor(self: WebLinkDto, documentation: WebLinkDto=null) {
    this.self = self;
    //this.documentation = documentation;
  }
}

export class ListNaviagateLinksDto extends NaviagateLinksDto {

  @ApiProperty()
  previous: WebLinkDto;

  @ApiProperty()
  next: WebLinkDto;

  constructor(
    self: WebLinkDto,
    previous: WebLinkDto,
    next: WebLinkDto,
    documentation: WebLinkDto,
  ) {
    super(self,documentation);
    this.next = next;
    this.previous = previous;
  }
}


export class QueryPaginationDto  {

  @ApiProperty()
  @IsOptional()
  @IsString()
  from: string;

  @ApiProperty()
  @Min(0)
  @Max(100)
  @Type(()=>Number)
  @IsOptional()
  limit: number=10;

}