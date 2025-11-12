# Em: escola/biblioteca/models.py
"""
App 'biblioteca': modelos para gestão da biblioteca da escola.
Inclui: autores, livros, empréstimos de livros.
"""

from django.db import models
from django.conf import settings
from escola.pedagogico.models import Aluno
from django.utils import timezone


# ========================
# MODELO AUTOR
# ========================
class Autor(models.Model):
    """
    Autor de livros na biblioteca.
    
    Relacionamentos:
    - livros (reverse): livros deste autor
    """
    
    # Nome completo do autor
    nome = models.CharField(max_length=255)

    def __str__(self):
        """Exibe o nome do autor"""
        return self.nome


# ========================
# MODELO LIVRO
# ========================
class Livro(models.Model):
    """
    Livro da biblioteca da escola.
    Controla quantidade total e quantidade disponível para empréstimo.
    
    Relacionamentos:
    - autor: quem escreveu o livro
    - emprestimos (reverse): histórico de empréstimos deste livro
    """
    
    # Título/nome do livro
    titulo = models.CharField(max_length=255)
    
    # Quem escreveu o livro (ForeignKey para permitir múltiplos livros do mesmo autor)
    # null=True: permite que o autor seja deletado sem deletar o livro
    autor = models.ForeignKey(Autor, on_delete=models.SET_NULL, null=True, related_name='livros')
    
    # Código ISBN (Internacional Standard Book Number)
    # unique=True: cada livro tem um ISBN único
    # blank=True, null=True: o ISBN é opcional (alguns livros antigos não têm)
    isbn = models.CharField(max_length=13, unique=True, blank=True, null=True)
    
    # Quantidade total de cópias do livro na biblioteca
    quantidade_total = models.PositiveIntegerField(default=1)
    
    # Quantidade de cópias disponíveis para empréstimo
    # (diminui quando alguém pega emprestado, aumenta quando devolve)
    quantidade_disponivel = models.PositiveIntegerField(default=1)

    def __str__(self):
        """Exibe 'Título (Autor)'"""
        return f"{self.titulo} ({self.autor.nome})"

    def save(self, *args, **kwargs):
        """
        Salva o livro no banco.
        Garante que a quantidade disponível nunca seja maior que a total.
        """
        # Validação: se disponível > total, ajusta para total
        if self.quantidade_disponivel > self.quantidade_total:
            self.quantidade_disponivel = self.quantidade_total
        super().save(*args, **kwargs)


# ========================
# MODELO EMPRESTIMO
# ========================
class Emprestimo(models.Model):
    """
    Registro de empréstimo de um livro para um aluno.
    Controla quando foi emprestado, quando deve devolver, e quando devolveu.
    
    Relacionamentos:
    - livro: qual livro foi emprestado
    - aluno: quem pegou emprestado
    """
    
    # Qual livro foi emprestado
    livro = models.ForeignKey(Livro, on_delete=models.CASCADE, related_name='emprestimos')
    
    # Para qual aluno o livro foi emprestado
    aluno = models.ForeignKey(Aluno, on_delete=models.CASCADE, related_name='emprestimos_livros')
    
    # Data em que o empréstimo foi feito (auto-preenchido com data atual)
    data_emprestimo = models.DateField(auto_now_add=True)
    
    # Data prevista para devolução (calculada automaticamente como 14 dias após empréstimo)
    data_devolucao_prevista = models.DateField()
    
    # Data real em que o livro foi devolvido (null = ainda não foi devolvido)
    data_devolucao_real = models.DateField(null=True, blank=True)
    
    class Meta:
        # Ordena empréstimos por data mais recente primeiro
        ordering = ['-data_emprestimo']

    def __str__(self):
        """Exibe 'Livro - Aluno'"""
        return f"{self.livro.titulo} - {self.aluno.usuario.username}"
    
    def save(self, *args, **kwargs):
        """
        Salva o empréstimo no banco.
        Se a data de devolução prevista não foi definida, calcula como 14 dias a partir de hoje.
        """
        # Se data de devolução não foi definida, calcula como 14 dias a partir de hoje
        if not self.data_devolucao_prevista:
            # timezone.now().date() = data de hoje
            # + timedelta(days=14) = adiciona 14 dias
            self.data_devolucao_prevista = timezone.now().date() + timezone.timedelta(days=14)
        super().save(*args, **kwargs)