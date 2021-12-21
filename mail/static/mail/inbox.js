document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // Submit email
  document.querySelector('#compose-form').addEventListener('submit', (event) => {
    event.preventDefault();
    submit_email();
  })

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#letter-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}


function submit_email() {

  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  // POST request to API route '/emails'
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  })
  .then(response => response.json())
  .then(result => {
    load_mailbox('sent');
  });
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#letter-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // GET request to API route '/emails/<mailbox>'
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    emails.forEach(email => {
      console.log(email);
      const element = document.createElement('div');
      element.className = 'letter';

      address = document.createElement('div');
      address.className = 'inline';
      if (mailbox === 'inbox' || mailbox === 'archive') {
        address.innerHTML = `<b>${email.sender}</b>`;  
      }
      else if (mailbox === 'sent') {
        address.innerHTML = `<b>${email.recipients}</b>`;
      };
      element.append(address);

      subject = document.createElement('div');
      subject.className = 'inline';
      subject.innerHTML = `${email.subject}`;
      element.append(subject);

      timestamp = document.createElement('div');
      timestamp.className = 'inline';
      timestamp.innerHTML = `${email.timestamp}`;
      element.append(timestamp);

      if (mailbox === 'inbox' || mailbox === 'archive') {
        archive_add = document.createElement('div');
        archive_add.className = 'inline_arch';
        arch_button = document.createElement('button');
        arch_button.className = 'btn-link';
        if (mailbox === 'inbox') {
          arch_button.innerHTML = 'Add to archive';
          parameter = true;
        }
        else {
          arch_button.innerHTML = 'Extract from archive';
          parameter = false;
        }
        arch_button.addEventListener('click', () => {
          archive(email.id, parameter);
        })
        archive_add.append(arch_button);
      }

      if (!email.read && mailbox === 'inbox') {
        element.style.backgroundColor = 'white';
      }
      else if (mailbox === 'inbox') {
        element.style.backgroundColor = 'lightgrey';
      }
      else {
        element.style.backgroundColor = 'white';
      };

      element.addEventListener('click',  function() {
        console.log('The letter is clicked');
        read_letter(email.id);
        show_letter(email.id, mailbox);
      });
      container = document.createElement('div')
      container.append(element);
      if (mailbox === 'inbox' || mailbox === 'archive') {
        container.append(archive_add);
      };  
      document.querySelector('#emails-view').append(container);
    });
  });
}

function read_letter(email_id) {
  console.log('letter read');
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
        read: true
    })
  })
}

function show_letter(letter_id, mailbox) {

  // Show the letter and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#letter-view').style.display = 'block';

  // Clear out letter field
  document.querySelector('#letter-view').innerHTML = '';

  // GET request to API route '/emails/<email_id>'
  fetch(`/emails/${letter_id}`)
  .then(response => response.json())
  .then(email => {
    const element = document.createElement('div');

    const sender = document.createElement('p');
    sender.innerHTML = `<b>From:</b> ${email.sender}`;
    element.append(sender);

    const recipients = document.createElement('p');
    recipients.innerHTML = `<b>To:</b> ${email.recipients}`;
    element.append(recipients);

    const subject = document.createElement('p');
    subject.innerHTML = `<b>Subject:</b> ${email.subject}`;
    element.append(subject);

    const timestamp = document.createElement('p');
    timestamp.innerHTML = `<b>Timestamp:</b> ${email.timestamp}`;
    element.append(timestamp);

    const body = document.createElement('p');
    body.innerHTML = `<br>${email.body}`;
    element.append(body);

    if (mailbox === 'inbox') {
      const reply = document.createElement('button');
      reply.className = 'btn btn-sm btn-outline-primary';
      reply.innerHTML = 'Reply';
      reply.type = 'submit';
      reply.addEventListener('click', () => reply_func(email.sender, email.subject, email.timestamp, email.body));
      element.append(reply);
    }

    document.querySelector('#letter-view').append(element);
  });
}

function archive(email_id, parameter) {
  if (parameter === true) {
    alert('the letter added to archive');
  }
  else {
    alert('the letter extracted from archive');
  };
  fetch(`/emails/${email_id}`, {
    method: 'PUT',
    body: JSON.stringify({
        archived: parameter
    })
  })
  load_mailbox('inbox');
}

function reply_func(sender, subject, timestamp, body) {
  compose_email();
  document.querySelector('#compose-recipients').value = sender;
  if (subject.substring(0, 3) !== 'Re:') {
    subject = 'Re: ' + subject;
  }
  document.querySelector('#compose-subject').value = subject;
  document.querySelector('#compose-body').value = `On  ${timestamp}  ${sender} wrote: \n${body}\n`;
}
