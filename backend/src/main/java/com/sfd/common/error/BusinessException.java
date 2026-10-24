package com.sfd.common.error;

import org.springframework.http.HttpStatus;

/**
 * Exception metier portant un code stable expose dans ProblemDetail.
 */
public class BusinessException extends RuntimeException {

    private final String code;
    private final HttpStatus status;

    public BusinessException(String code, HttpStatus status, String message) {
        super(message);
        this.code = code;
        this.status = status;
    }

    public BusinessException(String code, String message) {
        this(code, HttpStatus.BAD_REQUEST, message);
    }

    public static BusinessException notFound(String code, String message) {
        return new BusinessException(code, HttpStatus.NOT_FOUND, message);
    }

    public static BusinessException forbidden(String code, String message) {
        return new BusinessException(code, HttpStatus.FORBIDDEN, message);
    }

    public String getCode() {
        return code;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
