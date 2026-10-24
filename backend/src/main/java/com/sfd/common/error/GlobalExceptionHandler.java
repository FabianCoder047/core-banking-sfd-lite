package com.sfd.common.error;

import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ProblemDetail> handleBusiness(BusinessException ex) {
        return build(ex.getStatus(), ex.getCode(), ex.getMessage(), null);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProblemDetail> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> erreurs = new LinkedHashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            erreurs.putIfAbsent(error.getField(), error.getDefaultMessage());
        }
        return build(HttpStatus.BAD_REQUEST, "VALIDATION_ECHEC",
                "La requete contient des champs invalides.", erreurs);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ProblemDetail> handleConstraint(ConstraintViolationException ex) {
        return build(HttpStatus.BAD_REQUEST, "VALIDATION_ECHEC", ex.getMessage(), null);
    }

    @ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class,
            MissingServletRequestParameterException.class})
    public ResponseEntity<ProblemDetail> handleMalformed(Exception ex) {
        return build(HttpStatus.BAD_REQUEST, "REQUETE_INVALIDE", "Requete malformee ou parametre invalide.", null);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ProblemDetail> handleAccessDenied(AccessDeniedException ex) {
        return build(HttpStatus.FORBIDDEN, "ACCES_REFUSE", "Vous n'avez pas les droits pour cette operation.", null);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ProblemDetail> handleAuthentication(AuthenticationException ex) {
        return build(HttpStatus.UNAUTHORIZED, "NON_AUTHENTIFIE", "Authentification requise.", null);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ProblemDetail> handleIntegrity(DataIntegrityViolationException ex) {
        log.warn("Violation d'integrite : {}", ex.getMostSpecificCause().getMessage());
        return build(HttpStatus.CONFLICT, "CONFLIT_DONNEES",
                "L'operation entre en conflit avec des donnees existantes.", null);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetail> handleUnexpected(Exception ex) {
        log.error("Erreur inattendue", ex);
        return build(HttpStatus.INTERNAL_SERVER_ERROR, "ERREUR_INTERNE",
                "Une erreur interne est survenue.", null);
    }

    private ResponseEntity<ProblemDetail> build(HttpStatus status, String code, String detail, Object erreurs) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, detail);
        problem.setTitle(status.getReasonPhrase());
        problem.setType(URI.create("urn:sfd:erreur:" + code));
        problem.setProperty("code", code);
        if (erreurs != null) {
            problem.setProperty("erreurs", erreurs);
        }
        return ResponseEntity.status(status).body(problem);
    }
}
