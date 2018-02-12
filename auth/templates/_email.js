api = {},
l=require('../config/lib');
var nodemailer = require('nodemailer');
var path = require('path');
var templatesDir = path.join(__dirname, '..', 'emailTemplates');
var Email = require('email-templates')
var email = new Email(path.join(templatesDir, 'sample'));

//var template = new EmailTemplate(path.join(templatesDir, 'sample'));


///Used for Send Grid
var sg = require('sendgrid')(l.config.sendgrid);

var mailgun = require('mailgun-js')({
  apiKey: l.config.mailgun.api_key,
  domain: l.config.mailgun.domain
});

//Used for NodeMailer GMail
var transporter = nodemailer.createTransport({
	service: l.config.mailer.service,
	auth: {
		user: l.config.mailer.user,
		pass: l.config.mailer.pass
	}
});


api.sendmail=function(fromId,toId,subject,body,callback){
	if (l.config.mainlservice === "mailgun")
	{
		var data = {
		      from: fromId,
		      to: toId,
		      subject: subject,
		      html: body
		};
		mailgun.messages().send(data).then(function (response) {
		return callback(false,response);
	})
	.catch(function (error) {
	    return callback(error.response,error.response.statusCode);
	});
	}
	else if (l.config.mainlservice === "sg")
	{
	var request = sg.emptyRequest({
		method: 'POST',
		path: '/v3/mail/send',
		body: {
			personalizations: [
			{
				to: [
				{
					email: toId
				}
				],
				subject: subject
			}
			],
			from: {
				email: fromId
			},
			content: [
			{
				type: 'text/html',
				value: body
			}
			]
		}
	});

	sg.API(request)
	.then(function (response) {
		return callback(false,response);
	})
	.catch(function (error) {
	    return callback(error.response,error.response.statusCode);
	});
}
};


api.sendmailG = function (toId, subject, body, callback) {
	var mailOptions = {
		to: toId, // list of receivers
		subject: subject, // Subject line
		text: body.text, // plaintext body
		html: body.html
	};

	// send mail with defined transport object
	return transporter.sendMail(mailOptions, function (err, info) {
		if (err) {
			console.log('Message NOT sent: ' + err);
			return callback(err, 500)
		} else {
			console.log('Message sent: ' + info.response);
			return callback(false, info.response);
		}
	});
};


//Test Email Testing
api.sendmailGTemplate = function (toId, subject, data, callback) {
	var locals = {
		email: toId,
		userName: data.name
	};
	template.render(locals, function (err, results) {
		if (err) {
			console.log(err);
			return callback(err, 500);
		} else {
			var mailOptions = {
				to: toId, // list of receivers
				subject: subject, // Subject line
				text: results.text, // plaintext body
				html: results.html
			};

			// send mail with defined transport object
			return transporter.sendMail(mailOptions, function (err, info) {
				if (err) {
					console.log('Message NOT sent: ' + err);
					return callback(err, 500)
				} else {
					console.log('Message sent: ' + info.response);
					return callback(false, info.response);
				}
			});
		}
	});
};


module.exports = api;
