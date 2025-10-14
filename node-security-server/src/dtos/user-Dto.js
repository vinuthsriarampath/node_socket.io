export class UserDto {
    constructor(user) {
        if (!user) {
            throw new Error('User data is required');
        }
        this.id = user._id.toString();
        this.email = user.email;
        this.firstName = user.firstName;
        this.lastName = user.lastName;
        this.dob = user.dob;
        this.address = user.address;
        this.phone = user.phone;
    }
}