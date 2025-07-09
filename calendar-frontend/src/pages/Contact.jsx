import React, { useState } from 'react';
import { Container, Typography, TextField, Button, Box, Paper, Alert } from '@mui/material';

export default function Contact() {
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactMsg, setContactMsg] = useState('');
  const [contactStatus, setContactStatus] = useState('');

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setContactStatus('');
    try {
      const res = await fetch('http://localhost:3000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail,
          message: contactMsg,
        }),
      });
      if (res.ok) {
        setContactStatus('Tack! Vi har tagit emot din förfrågan.');
        setContactName('');
        setContactEmail('');
        setContactMsg('');
      } else {
        setContactStatus('Något gick fel. Försök igen senare.');
      }
    } catch {
      setContactStatus('Något gick fel. Försök igen senare.');
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 15, mb: 5 }}>
      <Paper sx={{ p: 4, borderRadius: 3, boxShadow: '0 2px 8px rgba(60,64,67,.06)' }}>
        <Typography variant="h4" gutterBottom sx={{
          fontWeight: 600,
          color: '#0a2540',
          fontFamily: "'Inter','Segoe UI','Roboto','Arial',sans-serif",
          mb: 3
        }}>
          Kontakta oss
        </Typography>
        
        <Typography variant="body1" sx={{ color: '#425466', mb: 4, fontSize: 16 }}>
          Har du frågor om BookR eller behöver hjälp? Skicka oss ett meddelande så återkommer vi så snart som möjligt.
        </Typography>

        <form onSubmit={handleContactSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              label="Ditt namn"
              variant="outlined"
              value={contactName}
              onChange={e => setContactName(e.target.value)}
              required
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />
            <TextField
              label="Din e-post"
              variant="outlined"
              type="email"
              value={contactEmail}
              onChange={e => setContactEmail(e.target.value)}
              required
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />
            <TextField
              label="Meddelande"
              variant="outlined"
              value={contactMsg}
              onChange={e => setContactMsg(e.target.value)}
              required
              fullWidth
              multiline
              minRows={4}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              size="large"
              sx={{ 
                mt: 2, 
                fontWeight: 600,
                borderRadius: 2,
                py: 1.5
              }}
            >
              Skicka meddelande
            </Button>
          </Box>
        </form>
        
        {contactStatus && (
          <Alert 
            severity={contactStatus.startsWith('Tack') ? 'success' : 'error'} 
            sx={{ mt: 3 }}
          >
            {contactStatus}
          </Alert>
        )}
      </Paper>
    </Container>
  );
}