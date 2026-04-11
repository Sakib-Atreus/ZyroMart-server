import { AuthServices } from "../../auth/auth.service"
import { USER_ROLE } from "../user.constant"
import User from "../user.model"

const adminSeeder = async () => {
    const admin = {
        name: "Admin",
        phone: "01777777777",
        email: process.env.admin_user || "admin@gmail.com",
        password: process.env.admin_password || "admin",
        role: USER_ROLE.admin,
        address: "Dhaka, Bangladesh"
    }
    // console.log("admin check ....")
    const adminExist = await User.findOne({role:USER_ROLE.admin})
    if(!adminExist)
    {
        console.log("seeding admin....")
        const createAdmin = AuthServices.registeredUserIntoDB(admin)
        if(!createAdmin)
        {
            throw Error ("Admin couldn't be created!")
        }
    }
}

export default adminSeeder