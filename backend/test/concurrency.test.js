const PRODUCT_ID =
    "fe539a42-ae92-4647-bbc1-691bb1bf53b7";

const TOTAL_REQUESTS = 16;


const buySneaker = async (userNumber) => {

    const response = await fetch(
        "http://localhost:5000/api/sale/buy",
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                userId: `load-test-user-${userNumber}`,
                productId: PRODUCT_ID
            })
        }
    );

    const data = await response.json();

    return {
        status: response.status,
        data
    };
};


const runTest = async () => {

    console.log(
        `Starting ${TOTAL_REQUESTS} concurrent requests...`
    );

    const requests = [];

    for (let i = 1; i <= TOTAL_REQUESTS; i++) {

        requests.push(
            buySneaker(i)
        );
    }

    const results = await Promise.all(
        requests
    );

    const success = results.filter(
        result => result.status === 200
    );

    const errors = results.filter(
        result => result.status >= 500
    );

    const waitlist = results.filter(
        result =>
            result.data?.message ===
            "Sneaker is out of stock. User added to waitlist."
    );

    console.log("\n========== RESULT ==========\n");

    console.log(
        "Total requests:",
        TOTAL_REQUESTS
    );

    console.log(
        "Successful:",
        success.length
    );

    console.log(
        "Waitlisted:",
        waitlist.length
    );

    console.log(
        "Server errors:",
        errors.length
    );

};


runTest();