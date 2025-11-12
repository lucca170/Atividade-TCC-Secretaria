// Em: frontend/src/pages/RelatorioAluno.jsx (CORRIGIDO COM DOWNLOAD AUTENTICADO)

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom'; 
import axios from 'axios';
import { 
    Box, 
    Typography, 
    CircularProgress, 
    Paper, 
    List, 
    ListItem, 
    ListItemText, 
    Button, 
    Divider,
    IconButton,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Alert,
    Grid // Para organizar as notas
} from '@mui/material';
import EditarNotasModal from '../components/EditarNotasModal'; 

// Ícones
import AddCommentIcon from '@mui/icons-material/AddComment';
import BlockIcon from '@mui/icons-material/Block';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download'; 

// Função para buscar o cargo do usuário logado
const getUserRole = () => {
  try {
    const userData = localStorage.getItem('userData');
    if (!userData) return null;
    const user = JSON.parse(userData);
    return user.cargo;
  } catch (e) { return null; }
};

// Roles que podem editar notas (Professor ou Admin)
const canEditRoles = ['administrador', 'coordenador', 'diretor', 'ti', 'professor'];
const adminRoles = ['administrador', 'coordenador', 'diretor', 'ti'];


// Função para formatar data (evitando problemas de fuso)
const formatarData = (dataStr) => {
    try {
        const data = new Date(dataStr);
        // Adiciona 1 dia (UTC) para corrigir a exibição
        data.setUTCDate(data.getUTCDate() + 1); 
        return data.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    } catch (e) {
        return 'Data inválida';
    }
};

function RelatorioAluno() {
    const { alunoId } = useParams(); 
    const token = localStorage.getItem('authToken');
    const backendUrl = 'http://127.0.0.1:8000'; 
    
    // Estados do componente
    const [alunoData, setAlunoData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [userRole, setUserRole] = useState(null); 
    const [advertencias, setAdvertencias] = useState([]);
    const [suspensoes, setSuspensoes] = useState([]);
    const [faltas, setFaltas] = useState([]);
    
    // Estados das Notas
    const [notas, setNotas] = useState({}); 
    const [loadingNotas, setLoadingNotas] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Estado para Diálogo de Exclusão
    const [dialogOpen, setDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null); 
    const [deleteError, setDeleteError] = useState('');
    const [deleteSuccess, setDeleteSuccess] = useState('');

    // --- 1. ESTADOS PARA O BOTÃO DE PDF ---
    const [isDownloading, setIsDownloading] = useState(false);
    const [pdfError, setPdfError] = useState('');
    // --- FIM ---

    // Função para buscar dados disciplinares (Advert/Suspens)
    const fetchDisciplinar = useCallback(async () => {
        if (!token) return;
        try {
            const headers = { 'Authorization': `Token ${token}` };
            const apiUrlAdvertencias = `${backendUrl}/disciplinar/api/advertencias/?aluno_id=${alunoId}`;
            const apiUrlSuspensoes = `${backendUrl}/disciplinar/api/suspensoes/?aluno_id=${alunoId}`;
            const apiUrlFaltas = `${backendUrl}/pedagogico/api/faltas/?aluno_id=${alunoId}`;

            const [resAdvertencias, resSuspensoes, resFaltas] = await Promise.all([
                axios.get(apiUrlAdvertencias, { headers }),
                axios.get(apiUrlSuspensoes, { headers }),
                axios.get(apiUrlFaltas, { headers })
            ]);
            
            setAdvertencias(resAdvertencias.data);
            setSuspensoes(resSuspensoes.data);
            setFaltas(resFaltas.data);

        } catch (err) {
             console.error("Erro ao buscar dados disciplinares:", err);
             setError(prev => (prev || '') + ' Erro ao carregar ocorrências.');
        }
    }, [alunoId, token]);

    // useEffect principal (Busca dados do Aluno + Disciplinares)
    useEffect(() => {
        setUserRole(getUserRole()); 
        
        if (!token) {
            setError('Token de autenticação não encontrado.');
            setLoading(false);
            return;
        }
        
        const apiUrlRelatorio = `${backendUrl}/pedagogico/relatorio/aluno/${alunoId}/`; 

        setLoading(true);
        setError(null);
        setDeleteError('');
        setDeleteSuccess('');

        const fetchDadosIniciais = async () => {
            try {
                const headers = { 'Authorization': `Token ${token}` };
                const resRelatorio = await axios.get(apiUrlRelatorio, { headers });
                setAlunoData(resRelatorio.data);
                await fetchDisciplinar();

            } catch (err) {
                console.error("Erro ao buscar dados do aluno:", err);
                let errorMsg = 'Não foi possível carregar os dados do aluno.';
                if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                     errorMsg = 'Acesso não autorizado.';
                } else if (err.response && err.response.status === 404) {
                     errorMsg = `Aluno com ID ${alunoId} não encontrado.`;
                }
                setError(errorMsg);
            } finally {
                setLoading(false);
            }
        };
        
        fetchDadosIniciais();
    }, [alunoId, token, fetchDisciplinar]); 

    // Função para buscar as notas
    const fetchNotas = useCallback(() => {
        if (!token) return;
        
        const apiUrlNotas = `${backendUrl}/pedagogico/api/notas/?aluno_id=${alunoId}`;
        setLoadingNotas(true);
        
        axios.get(apiUrlNotas, { headers: { 'Authorization': `Token ${token}` } })
            .then(response => {
                const notasPorMateria = response.data.reduce((acc, nota) => {
                    const materiaNome = nota.disciplina_nome || 'Matéria Desconhecida';
                    if (!acc[materiaNome]) {
                        acc[materiaNome] = { N1: '', N2: '', N3: '', N4: '', Media: '' };
                    }
                    
                    let bimestreKey = '';
                    if (nota.bimestre === '1º Bimestre') bimestreKey = 'N1';
                    else if (nota.bimestre === '2º Bimestre') bimestreKey = 'N2';
                    else if (nota.bimestre === '3º Bimestre') bimestreKey = 'N3';
                    else if (nota.bimestre === '4º Bimestre') bimestreKey = 'N4';
                    
                    if (bimestreKey) {
                        acc[materiaNome][bimestreKey] = nota.valor;
                    }
                    
                    const notasValidas = [
                        acc[materiaNome].N1, 
                        acc[materiaNome].N2, 
                        acc[materiaNome].N3, 
                        acc[materiaNome].N4
                    ]
                    .map(Number)
                    .filter(n => !isNaN(n) && n !== null && n >= 0); 
                    
                    if(notasValidas.length > 0) {
                        const media = notasValidas.reduce((a, b) => a + b, 0) / notasValidas.length;
                        acc[materiaNome].Media = media.toFixed(2);
                    }

                    return acc;
                }, {});
                setNotas(notasPorMateria);
            })
            .catch(err => {
                console.error("Erro ao buscar notas:", err);
                setError(prev => (prev ? prev + ' Erro ao buscar notas.' : 'Erro ao buscar notas.'));
            })
            .finally(() => {
                setLoadingNotas(false);
            });
    }, [alunoId, token]); 

    // useEffect para buscar notas
    useEffect(() => {
        if (alunoData) {
            fetchNotas();
        }
    }, [alunoData, fetchNotas]);


    // --- 2. FUNÇÃO PARA LIDAR COM O DOWNLOAD DO PDF ---
    const handleDownloadPDF = async () => {
        setIsDownloading(true);
        setPdfError(''); 

        try {
            const pdfUrl = `${backendUrl}/pedagogico/relatorio/aluno/${alunoId}/pdf/`;
            
            const response = await axios.get(pdfUrl, {
                headers: { 'Authorization': `Token ${token}` },
                responseType: 'blob', // <-- Muito importante: espera um arquivo
            });

            // Cria um Blob (arquivo) com os dados recebidos
            const blob = new Blob([response.data], { type: 'application/pdf' });

            // Cria uma URL temporária para o arquivo
            const url = window.URL.createObjectURL(blob);

            // Cria um link <a> invisível
            const link = document.createElement('a');
            link.href = url;
            
            // Define o nome do arquivo para download
            const username = alunoData?.matricula || alunoId; 
            link.setAttribute('download', `boletim_${username}.pdf`);
            
            // Simula o clique no link
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Limpa a URL temporária
            window.URL.revokeObjectURL(url);

        } catch (err) {
            console.error("Erro ao baixar PDF:", err);
            setPdfError('Erro ao baixar PDF. Verifique sua permissão.');
        } finally {
            setIsDownloading(false);
        }
    };
    // --- FIM DA FUNÇÃO DE DOWNLOAD ---


    // --- Funções de Exclusão ---
    const handleClickDelete = (id, type) => {
        setItemToDelete({ id, type });
        setDialogOpen(true);
        setDeleteError('');
        setDeleteSuccess('');
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setItemToDelete(null);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        const { id, type } = itemToDelete;
        
        let apiUrl;
        if (type === 'faltas') {
            apiUrl = `${backendUrl}/pedagogico/api/${type}/${id}/`;
        } else {
            apiUrl = `${backendUrl}/disciplinar/api/${type}/${id}/`;
        }

        try {
            await axios.delete(apiUrl, {
                headers: { 'Authorization': `Token ${token}` }
            });
            
            setDeleteSuccess('Item excluído com sucesso!');
            if (type === 'advertencias') {
                setAdvertencias(prev => prev.filter(item => item.id !== id));
            } else if (type === 'suspensoes') {
                setSuspensoes(prev => prev.filter(item => item.id !== id));
            } else if (type === 'faltas') {
                setFaltas(prev => prev.filter(item => item.id !== id));
            }
            
        } catch (err) {
            console.error("Erro ao excluir:", err);
            setDeleteError('Erro ao excluir o item. Tente novamente.');
        } finally {
            handleCloseDialog();
        }
    };


    // --- RENDERIZAÇÃO ---

    if (loading) {
        return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    }

    if (error) {
        return <Alert severity="error" sx={{ mt: 4, mx: 'auto', maxWidth: 900 }}>{error}</Alert>;
    }

    if (!alunoData) {
        return <Typography sx={{ mt: 4, textAlign: 'center' }}>Nenhum dado do aluno encontrado.</Typography>;
    }

    const podeEditarNotas = userRole && canEditRoles.includes(userRole);
    const ehAdmin = userRole && adminRoles.includes(userRole);

    return (
        <Box sx={{ maxWidth: 900, margin: 'auto', padding: 2 }}>
            
            {/* 1. DADOS DO ALUNO E BOTÕES DE AÇÃO */}
            <Paper elevation={3} sx={{ padding: 3, mb: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Relatório Individual do Aluno
                </Typography>
                <Typography variant="h6"><strong>Nome:</strong> {alunoData.nome}</Typography>
                <Typography variant="body1"><strong>Matrícula:</strong> {alunoData.matricula}</Typography>
                <Typography variant="body1"><strong>Turma:</strong> {alunoData.turma_nome}</Typography>
                <Typography variant="body1"><strong>Responsável:</strong> {alunoData.responsavel_nome} ({alunoData.responsavel_email})</Typography>

                {/* Área de Botões de Ação */}
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 3, mb: 2 }}>
                    
                    {/* --- 3. BOTÃO DE PDF MODIFICADO --- */}
                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={isDownloading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
                        onClick={handleDownloadPDF} // <-- Chama a função
                        disabled={isDownloading} // <-- Desabilita durante o download
                    >
                        {isDownloading ? 'Baixando...' : 'Baixar Boletim PDF'}
                    </Button>
                    {/* --- FIM DA MODIFICAÇÃO --- */}
                    
                    {podeEditarNotas && (
                        <Button 
                            variant="contained" 
                            color="primary" 
                            startIcon={<EditIcon />}
                            onClick={() => setIsModalOpen(true)}
                        >
                            Editar Notas
                        </Button>
                    )}
                    
                    {ehAdmin && (
                        <>
                            <Button
                                variant="contained"
                                color="warning"
                                startIcon={<AddCommentIcon />}
                                component={RouterLink}
                                to={`/adicionar-advertencia?alunoId=${alunoId}`}
                            >
                                Registrar Advertência
                            </Button>
                            <Button
                                variant="contained"
                                color="error"
                                startIcon={<BlockIcon />}
                                component={RouterLink}
                                to={`/adicionar-suspensao?alunoId=${alunoId}`}
                            >
                                Registrar Suspensão
                            </Button>
                        </>
                    )}

                    {userRole === 'professor' && (
                        <Button
                            variant="contained"
                            color="info"
                            startIcon={<AddCommentIcon />}
                            component={RouterLink}
                            to={`/adicionar-falta?alunoId=${alunoId}`}
                        >
                            Lançar Falta
                        </Button>
                    )}
                </Box>
                
                {/* --- 4. ALERTA DE ERRO PARA PDF --- */}
                {pdfError && <Alert severity="error" sx={{ mt: 2 }}>{pdfError}</Alert>}
                
            </Paper>

            {/* 2. BOLETIM DE NOTAS */}
            <Paper elevation={3} sx={{ padding: 3, mb: 3 }}>
                <Typography variant="h5" gutterBottom>Boletim de Notas</Typography>
                {loadingNotas ? <CircularProgress size={24} /> : (
                    <Box sx={{ overflowX: 'auto' }}>
                        {/* Cabeçalho */}
                        <Grid container spacing={1} sx={{ borderBottom: '2px solid #333', pb: 1, mb: 1, minWidth: 500 }}>
                            <Grid item xs={4}><Typography variant="body1" sx={{ fontWeight: 'bold' }}>Matéria</Typography></Grid>
                            <Grid item xs={1}><Typography variant="body1" sx={{ fontWeight: 'bold' }}>N1</Typography></Grid>
                            <Grid item xs={1}><Typography variant="body1" sx={{ fontWeight: 'bold' }}>N2</Typography></Grid>
                            <Grid item xs={1}><Typography variant="body1" sx={{ fontWeight: 'bold' }}>N3</Typography></Grid>
                            <Grid item xs={1}><Typography variant="body1" sx={{ fontWeight: 'bold' }}>N4</Typography></Grid>
                            <Grid item xs={2}><Typography variant="body1" sx={{ fontWeight: 'bold' }}>Média</Typography></Grid>
                        </Grid>
                        {/* Linhas de Notas */}
                        {Object.keys(notas).length > 0 ? (
                            Object.entries(notas).map(([materia, n]) => (
                                <Grid container spacing={1} key={materia} sx={{ borderBottom: '1px solid #eee', py: 1, minWidth: 500 }}>
                                    <Grid item xs={4}><Typography variant="body2">{materia}</Typography></Grid>
                                    <Grid item xs={1}><Typography variant="body2">{n.N1 ?? 'N/A'}</Typography></Grid>
                                    <Grid item xs={1}><Typography variant="body2">{n.N2 ?? 'N/A'}</Typography></Grid>
                                    <Grid item xs={1}><Typography variant="body2">{n.N3 ?? 'N/A'}</Typography></Grid>
                                    <Grid item xs={1}><Typography variant="body2">{n.N4 ?? 'N/A'}</Typography></Grid>
                                    <Grid item xs={2}><Typography variant="body2" sx={{ fontWeight: 'bold' }}>{n.Media ?? 'N/A'}</Typography></Grid>
                                </Grid>
                            ))
                        ) : (
                            <Typography variant="body2" sx={{ mt: 2 }}>Nenhuma nota lançada para este aluno.</Typography>
                        )}
                    </Box>
                )}
            </Paper>

            {/* 3. SEÇÃO DISCIPLINAR (Advertências e Suspensões) */}
            <Paper elevation={3} sx={{ padding: 3, mb: 3 }}>
                <Typography variant="h5" gutterBottom>Ocorrências Disciplinares</Typography>
                
                {deleteError && <Alert severity="error" onClose={() => setDeleteError('')}>{deleteError}</Alert>}
                {deleteSuccess && <Alert severity="success" onClose={() => setDeleteSuccess('')}>{deleteSuccess}</Alert>}

                {/* Lista de Advertências */}
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>Advertências</Typography>
                {advertencias.length > 0 ? (
                    <List dense>
                        {advertencias.map(adv => (
                            <ListItem 
                                key={adv.id} 
                                sx={{ borderBottom: '1px solid #eee' }}
                                secondaryAction={ehAdmin && (
                                    <Box>
                                        <IconButton 
                                            edge="end" 
                                            aria-label="editar" 
                                            component={RouterLink}
                                            to={`/editar-advertencia/${adv.id}`} 
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton 
                                            edge="end" 
                                            aria-label="excluir" 
                                            onClick={() => handleClickDelete(adv.id, 'advertencias')} 
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                )}
                            >
                                <ListItemText 
                                    primary={adv.motivo}
                                    secondary={`Data: ${formatarData(adv.data)} - Registrado por: ${adv.registrado_por_nome}`}
                                />
                            </ListItem>
                        ))}
                    </List>
                ) : (
                    <Typography variant="body2">Nenhuma advertência registrada.</Typography>
                )}

                <Divider sx={{ my: 2 }} />

                {/* Lista de Suspensões */}
                <Typography variant="h6" gutterBottom>Suspensões</Typography>
                {suspensoes.length > 0 ? (
                    <List dense>
                        {suspensoes.map(susp => (
                            <ListItem 
                                key={susp.id} 
                                sx={{ borderBottom: '1px solid #eee' }}
                                secondaryAction={ehAdmin && (
                                    <Box>
                                        <IconButton 
                                            edge="end" 
                                            aria-label="editar"
                                            component={RouterLink}
                                            to={`/editar-suspensao/${susp.id}`} 
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton 
                                            edge="end" 
                                            aria-label="excluir"
                                            onClick={() => handleClickDelete(susp.id, 'suspensoes')} 
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                )}
                            >
                                <ListItemText 
                                    primary={susp.motivo}
                                    secondary={`Período: ${formatarData(susp.data_inicio)} a ${formatarData(susp.data_fim)}`}
                                />
                            </ListItem>
                        ))}
                    </List>
                ) : (
                    <Typography variant="body2">Nenhuma suspensão registrada.</Typography>
                )}

                <Divider sx={{ my: 2 }} />

                {/* Lista de Faltas */}
                <Typography variant="h6" gutterBottom>Faltas</Typography>
                {faltas.length > 0 ? (
                    <List dense>
                        {faltas.map(falta => (
                            <ListItem 
                                key={falta.id} 
                                sx={{ borderBottom: '1px solid #eee' }}
                                secondaryAction={userRole === 'professor' && (
                                    <Box>
                                        <IconButton 
                                            edge="end" 
                                            aria-label="editar"
                                            component={RouterLink}
                                            to={`/editar-falta/${falta.id}?alunoId=${alunoId}`}
                                        >
                                            <EditIcon />
                                        </IconButton>
                                        <IconButton 
                                            edge="end" 
                                            aria-label="excluir"
                                            onClick={() => handleClickDelete(falta.id, 'faltas')}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box>
                                )}
                            >
                                <ListItemText 
                                    primary={`${falta.disciplina_nome || 'Disciplina desconhecida'} - ${falta.justificada ? '✓ Justificada' : '✗ Não justificada'}`}
                                    secondary={`Data: ${formatarData(falta.data)}`}
                                />
                            </ListItem>
                        ))}
                    </List>
                ) : (
                    <Typography variant="body2">Nenhuma falta registrada.</Typography>
                )}
            </Paper>

            {/* Modal de Edição de Notas (pop-up) */}
            {podeEditarNotas && (
                <EditarNotasModal
                    open={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    alunoId={alunoId}
                    turmaId={alunoData.turma} // Passando o ID da turma
                    onSave={fetchNotas} // Recarrega as notas após salvar
                />
            )}

            {/* Diálogo de Confirmação de Exclusão */}
            <Dialog
                open={dialogOpen}
                onClose={handleCloseDialog}
            >
                <DialogTitle>Confirmar Exclusão</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Você tem certeza que deseja excluir esta ocorrência? 
                        Esta ação não pode ser desfeita.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} color="primary">
                        Cancelar
                    </Button>
                    <Button onClick={handleConfirmDelete} color="error">
                        Excluir
                    </Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
}

export default RelatorioAluno;