import { toast } from "react-hot-toast";
import { studentEndpoints } from "../apis";
import { apiConnector } from "../apiconnector";
import rzpLogo from "../../assets/Logo/rzp_logo.png"
import { setPaymentLoading } from "../../slices/courseSlice";
import { resetCart } from "../../slices/cartSlice";
import { clearCheckoutKey } from "../../utils/checkoutKey";

const activeCheckoutKeys = new Set();

const {COURSE_PAYMENT_API, COURSE_VERIFY_API, SEND_PAYMENT_SUCCESS_EMAIL_API} = studentEndpoints;

function loadScript(src) {
    return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = src;

        script.onload = () => {
            resolve(true);
        }
        script.onerror= () =>{
            resolve(false);
        }
        document.body.appendChild(script);
    })
}


export async function buyCourse(
    token,
    courses,
    userDetails,
    navigate,
    dispatch,
    idempotencyKey,
    cartKey
) {
    if (activeCheckoutKeys.has(idempotencyKey)) {
        return;
    }
    activeCheckoutKeys.add(idempotencyKey);
    const toastId = toast.loading("Loading...");
    dispatch(setPaymentLoading(true));
    try{
        //load the script
        const res = await loadScript("https://checkout.razorpay.com/v1/checkout.js");

        if(!res) {
            toast.error("RazorPay SDK failed to load");
            activeCheckoutKeys.delete(idempotencyKey);
            dispatch(setPaymentLoading(false));
            return;
        }

        //initiate the order
        const orderResponse = await apiConnector("POST", COURSE_PAYMENT_API, 
                                {courses},
                                {
                                    Authorization: `Bearer ${token}`,
                                    "Idempotency-Key": idempotencyKey,
                                })

        if(!orderResponse.data.success) {
            throw new Error(orderResponse.data.message);
        }
        console.log("PRINTING orderResponse", orderResponse);
        dispatch(setPaymentLoading(false));
        //options
        const options = {
            key: process.env.REACT_APP_RAZORPAY_KEY,
            currency: orderResponse.data.data.currency,
            amount: `${orderResponse.data.data.amount}`,
            order_id:orderResponse.data.data.id,
            name:"CourseCraft",
            description: "Thank You for Purchasing the Course",
            image:rzpLogo,
            prefill: {
                name:`${userDetails.firstName}`,
                email:userDetails.email
            },
            handler: function(response) {
                //send successful wala mail
                sendPaymentSuccessEmail(response, orderResponse.data.data.amount,token );
                //verifyPayment
                verifyPayment(
                    {...response, courses},
                    token,
                    navigate,
                    dispatch,
                    idempotencyKey,
                    cartKey
                );
            },
            ondismiss: function() {
                clearCheckoutKey(cartKey);
                activeCheckoutKeys.delete(idempotencyKey);
                dispatch(setPaymentLoading(false));
            }
        }
        //miss hogya tha 
        const paymentObject = new window.Razorpay(options);
        paymentObject.open();
        paymentObject.on("payment.failed", function(response) {
            toast.error("oops, payment failed");
            console.log(response.error);
            clearCheckoutKey(cartKey);
            activeCheckoutKeys.delete(idempotencyKey);
            dispatch(setPaymentLoading(false));
        })
    }
    catch(error) {
        console.log("PAYMENT API ERROR.....", error);
        toast.error("Could not make Payment");
        activeCheckoutKeys.delete(idempotencyKey);
        dispatch(setPaymentLoading(false));
    }
    toast.dismiss(toastId);
}

async function sendPaymentSuccessEmail(response, amount, token) {
    try{
        await apiConnector("POST", SEND_PAYMENT_SUCCESS_EMAIL_API, {
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            amount,
        },{
            Authorization: `Bearer ${token}`
        })
    }
    catch(error) {
        console.log("PAYMENT SUCCESS EMAIL ERROR....", error);
    }
}

//verify payment
async function verifyPayment(
    bodyData,
    token,
    navigate,
    dispatch,
    idempotencyKey,
    cartKey
) {
    const toastId = toast.loading("Verifying Payment....");
    dispatch(setPaymentLoading(true));
    try{
        const response  = await apiConnector("POST", COURSE_VERIFY_API, bodyData, {
            Authorization:`Bearer ${token}`,
            "Idempotency-Key": idempotencyKey,
        })

        if(!response.data.success) {
            throw new Error(response.data.message);
        }
        toast.success("payment Successful, ypou are addded to the course");
        clearCheckoutKey(cartKey);
        activeCheckoutKeys.delete(idempotencyKey);
        navigate("/dashboard/enrolled-courses");
        dispatch(resetCart());
    }   
    catch(error) {
        console.log("PAYMENT VERIFY ERROR....", error);
        toast.error("Could not verify Payment");
        activeCheckoutKeys.delete(idempotencyKey);
    }
    toast.dismiss(toastId);
    dispatch(setPaymentLoading(false));
}
