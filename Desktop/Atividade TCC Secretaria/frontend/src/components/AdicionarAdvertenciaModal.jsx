// Em: frontend/src/components/AdicionarAdvertenciaModal.jsx
import React, { useState } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  CircularProgress,
  Typography,
  TextField,
  Alert
} from '@mui/material';

const token = localStorage.getItem('authToken');
const apiUrl = 'http://127.0.0.1:8000/disciplinar/api/advertencias/';

// Pega a data de hoje no formato YYYY-MM-DD
const getTodayDate = () => {
  return new Date().toISOString().split('T')[0];
};

function AdicionarAdvertenciaModal({ open, onClose, alunoId, alunoNome, onSaveSuccess }) {
  const [motivo, setMotivo] = useState('');
  const [data, setData] = useState(getTodayDate());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const payload = {
      aluno: alunoId,
      data: data,
      motivo: motivo,
    };

    try {
      await axios.post(apiUrl, payload, {
        headers: { 'Authorization': `Token ${token}` }
      });
      setIsSubmitting(false);
      onSaveSuccess(); // Chama a função de sucesso (para recarregar os dados)
      onClose(); // Fecha o modal
    } catch (err) {
      console.error("Erro ao lançar advertência:", err);
      setError(err.response?.data?.erro || "Erro ao salvar. Verifique os campos.");
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return; // Não deixa fechar durante o envio
    setMotivo('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Lançar Advertência
        <Typography variant="body2" color="text.secondary">
          Aluno: {alunoNome} (ID: {alunoId})
        </Typography>
      </DialogTitle>
      
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            label="Data da Advertência"
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            required
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Motivo da Advertência"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            required
            fullWidth
            multiline
            rows={4}
            margin="normal"
          />
        </DialogContent>
        
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button onClick={handleClose} color="secondary" disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={24} /> : "Salvar Advertência"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

export default AdicionarAdvertenciaModal;