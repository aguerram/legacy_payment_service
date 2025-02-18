import { IsEmail, IsString, MinLength } from "class-validator"

export class AuthDTO {
    @IsEmail()
    email:string
    
    @IsString()
    @MinLength(8, {
        message: 'The new password must be more than 8 charaters',
      })
    password:string
}