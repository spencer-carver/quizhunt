const { google } = require("googleapis");
const credentials = require("./credentials.json");
const {
    isAllowed,
    STAGING_API_DOMAIN,
    SPREADSHEET_ID
} = require("./private-helpers");

// If modifying these scopes, delete token.json.
const SCOPES = [
    "https://www.googleapis.com/auth/drive.readonly"
];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.

exports.handler = async (event) => {
    console.log(event);
    const {
        headers,
        pathParameters,
        requestContext
    } = event;

    const origin = headers.origin || headers.Origin;

    if ((!origin && requestContext.domainName !== STAGING_API_DOMAIN) || (origin && !isAllowed(origin))) {
        return {
            statusCode: 401,
            body: JSON.stringify({ error: "CORS error" })
        };
    }

    const response = {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": origin,
            "Access-Control-Allow-Credentials": "true",
            "Cache-Control": "max-age=3600, stale-while-revalidate=86400"
        },
        multiValueHeaders: {}
    };

    try {
        const client = await google.auth.getClient({
            credentials,
            scopes: SCOPES
        });
        const sheets = google.sheets({ version: "v4", auth: client });

        const data = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID, includeGridData: true });

        // row 0 is the header
        // column 0 is question title
        // column 1 is the correct answer
        // column 2,3,4 are incorrect answers
        const quizData = data.data.sheets[0].data[0].rowData.reduce((quizData, { values }, rowIndex) => {
            if (rowIndex === 0) {
                return quizData;
            }

            const questionData = {};
            values.forEach(({ formattedValue }, columnIndex) => {
                if (columnIndex === 0) {
                    questionData.question = formattedValue;
                } else if (columnIndex === 1) {
                    questionData.correct = formattedValue;
                } else {
                    questionData.incorrect = questionData.incorrect || [];
                    questionData.incorrect.push(formattedValue);
                }
            });

            quizData.push(questionData);

            return quizData;
        }, []);

        response.body = JSON.stringify(quizData);

        return response;
    } catch (error) {
        console.log(error);
        return {
            statusCode: 404,
            headers: {
                "Access-Control-Allow-Origin": origin,
                "Access-Control-Allow-Credentials": "true"
            },
            body: JSON.stringify(error),
        };
    }
};