import React, { useState, useRef } from 'react';
import { TextField, IconButton, Typography, Box, Chip, Stack } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';

const InviteFriend = ({ fromUser, fromToken }) => {
  const [emails, setEmails] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [message, setMessage] = useState('');
  const [groupLink, setGroupLink] = useState('');
  const inputRef = useRef();

  // Lägg till e-post om användaren trycker på , eller Enter eller Space
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const addEmail = (email) => {
    const trimmed = email.trim().replace(/,$/, '');
    if (
      trimmed &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) &&
      !emails.includes(trimmed)
    ) {
      setEmails([...emails, trimmed]);
    }
  };

  const handleInputKeyDown = (e) => {
    if (
      e.key === 'Enter' ||
      e.key === ',' ||
      e.key === ' ' ||
      e.key === 'Tab'
    ) {
      e.preventDefault();
      addEmail(inputValue);
      setInputValue('');
    }
  };

  const handleBlur = () => {
    addEmail(inputValue);
    setInputValue('');
  };

  const handleDelete = (emailToDelete) => {
    setEmails(emails.filter(email => email !== emailToDelete));
  };

  const sendInvites = async () => {
    if (emails.length === 0) {
      setMessage('Ange minst en e-postadress.');
      return;
    }

    // SÄKER: Hämta e-post från alla möjliga ställen
    let emailToSend = fromUser;
    if (
      typeof fromUser === 'object' &&
      fromUser &&
      (fromUser.email || (fromUser.emails && fromUser.emails.length > 0))
    ) {
      emailToSend =
        fromUser.email ||
        (fromUser.emails && fromUser.emails[0].value) ||
        (fromUser.emails && fromUser.emails[0]);
    }
    if (
      (!emailToSend || !emailToSend.includes('@')) &&
      window.user &&
      (window.user.email || (window.user.emails && window.user.emails.length > 0))
    ) {
      emailToSend =
        window.user.email ||
        (window.user.emails && window.user.emails[0].value) ||
        (window.user.emails && window.user.emails[0]);
    }
    // NYTT: Om fortfarande ingen giltig e-post, fråga användaren
    if (!emailToSend || !emailToSend.includes('@')) {
      setMessage(
        'Kunde inte hitta din e-postadress. Logga ut och logga in igen med ett Google-konto som har e-postadress. Om du är inloggad, kontrollera att du gett kalendern tillgång till din e-post.'
      );
      return;
    }

    try {
      const res = await fetch('http://localhost:3000/api/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emails,
          fromUser: emailToSend,
          fromToken,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage('Inbjudningar skickade!');
        setEmails([]);
        setInputValue('');
        if (data.inviteLinks && Array.isArray(data.inviteLinks)) {
          setGroupLink('');
          setMessage('Inbjudningar skickade! Skicka dessa länkar till dina vänner:');
          setGroupLink(data.inviteLinks.join('\n'));
        } else if (data.groupLink) {
          setGroupLink(data.groupLink);
        }
        if (data.groupId) {
          window.location.href = `${window.location.origin}${window.location.pathname}?group=${data.groupId}`;
        }
      } else {
        setMessage(data.error || 'Något gick fel.');
      }
    } catch (err) {
      console.error('Fel vid utskick:', err);
      setMessage('Tekniskt fel.');
    }
  };

  const handleCopy = () => {
    if (groupLink) {
      navigator.clipboard.writeText(groupLink);
      setMessage('Länken är kopierad!');
    }
  };

  return (
    <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, boxShadow: 1 }}>
      <Typography variant="h6" gutterBottom>Bjud in vänner</Typography>
      <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mb: 1 }}>
        {emails.map(email => (
          <Chip
            key={email}
            label={email}
            onDelete={() => handleDelete(email)}
            sx={{ mb: 1 }}
          />
        ))}
      </Stack>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <TextField
          label="E-postadress"
          value={inputValue}
          inputRef={inputRef}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          onBlur={handleBlur}
          fullWidth
          placeholder="Skriv e-post och tryck Enter eller ,"
          sx={{
            // Ta bort bakgrundsfärg, behåll rundade hörn
            '& .MuiOutlinedInput-root': {
              borderRadius: 999,
              background: 'transparent',
            },
            '& .MuiInputBase-root': {
              borderRadius: 999,
            },
          }}
          variant="outlined"
        />
        <IconButton
          aria-label="skicka inbjudningar"
          onClick={sendInvites}
          disabled={!inputValue && emails.length === 0}
          sx={{
            ml: 2,
            background: 'linear-gradient(90deg, #635bff 0%, #6c47ff 100%)',
            color: '#fff',
            borderRadius: '50%',
            width: 44,
            height: 44,
            boxShadow: '0 2px 8px 0 rgba(99,91,255,0.13)',
            transition: 'background 0.2s, box-shadow 0.2s',
            '&:hover': {
              background: 'linear-gradient(90deg, #7a5af8 0%, #635bff 100%)',
              boxShadow: '0 0 0 4px #e9e5ff, 0 8px 24px 0 rgba(99,91,255,0.18)',
            },
          }}
        >
          <SendIcon sx={{ color: '#fff' }} />
        </IconButton>
      </Box>
      {message && <Typography sx={{ mt: 2 }} color="success.main">{message}</Typography>}
      {groupLink && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {groupLink.split('\n').map((link, i) => (
              <div key={i}>
                <a href={link} target="_blank" rel="noopener noreferrer">{link}</a>
              </div>
            ))}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default InviteFriend;
