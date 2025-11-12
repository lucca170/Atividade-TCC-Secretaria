import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';

function EditarFalta() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = localStorage.getItem('authToken');
  const backendUrl = 'http://127.0.0.1:8000';

  const [falta, setFalta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const alunoId = searchParams.get('alunoId');

  // Carregar dados da falta
  useEffect(() => {
    const fetchFalta = async () => {
      try {
        const response = await axios.get(
          `${backendUrl}/pedagogico/api/faltas/${id}/`,
          { headers: { 'Authorization': `Token ${token}` } }
        );
        setFalta(response.data);
      } catch (err) {
        setError('Erro ao carregar os dados da falta.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchFalta();
    }
  }, [token, id, backendUrl]);

  // Salvar alterações
  const handleSalvar = async () => {
    if (!falta.data) {
      setError('A data é obrigatória.');
      return;
    }

    setSaving(true);
    try {
      await axios.put(
        `${backendUrl}/pedagogico/api/faltas/${id}/`,
        {
          aluno: falta.aluno,
          disciplina: falta.disciplina,
          data: falta.data,
          justificada: falta.justificada,
        },
        { headers: { 'Authorization': `Token ${token}` } }
      );

      setSuccess('Falta atualizada com sucesso!');
      setTimeout(() => {
        if (alunoId) {
          navigate(`/relatorio/aluno/${alunoId}`);
        } else {
          navigate(-1);
        }
      }, 1500);
    } catch (err) {
      setError('Erro ao atualizar a falta.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!falta) {
    return (
      <Container maxWidth="sm" sx={{ py: 4 }}>
        <Alert severity="error">Falta não encontrada.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => {
              if (alunoId) {
                navigate(`/relatorio/aluno/${alunoId}`);
              } else {
                navigate(-1);
              }
            }}
            sx={{ mr: 1 }}
          >
            Voltar
          </Button>
          <Typography variant="h5">Editar Falta</Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Aluno (somente leitura) */}
          <TextField
            fullWidth
            label="Aluno"
            value={falta.aluno_nome || ''}
            disabled
            variant="outlined"
          />

          {/* Disciplina (somente leitura) */}
          <TextField
            fullWidth
            label="Disciplina"
            value={falta.disciplina_nome || ''}
            disabled
            variant="outlined"
          />

          {/* Data */}
          <TextField
            fullWidth
            type="date"
            label="Data da Falta"
            value={falta.data}
            onChange={(e) => setFalta({ ...falta, data: e.target.value })}
            InputLabelProps={{ shrink: true }}
            variant="outlined"
          />

          {/* Justificada */}
          <FormControlLabel
            control={
              <Checkbox
                checked={falta.justificada || false}
                onChange={(e) => setFalta({ ...falta, justificada: e.target.checked })}
              />
            }
            label="Falta justificada"
          />

          {/* Botões de ação */}
          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button
              fullWidth
              variant="outlined"
              color="inherit"
              onClick={() => {
                if (alunoId) {
                  navigate(`/relatorio/aluno/${alunoId}`);
                } else {
                  navigate(-1);
                }
              }}
            >
              Cancelar
            </Button>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              onClick={handleSalvar}
              disabled={saving}
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}

export default EditarFalta;
